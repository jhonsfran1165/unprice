import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { eq, schema, sql, utils } from "@builderai/db"
import {
  createProjectSchema,
  deleteProjectSchema,
  renameProjectSchema,
  selectProjectSchema,
  transferToPersonalProjectSchema,
  transferToWorkspaceSchema,
} from "@builderai/validators/project"
import { selectWorkspaceSchema } from "@builderai/validators/workspace"

import {
  createTRPCRouter,
  protectedActiveWorkspaceAdminProcedure,
  protectedActiveWorkspaceProcedure,
  protectedProcedure,
} from "../../trpc"
import { projectGuard } from "../../utils"
import { getRandomPatternStyle } from "../../utils/generate-pattern"
import { workspaceGuard } from "../../utils/workspace-guard"

// TODO: Don't hardcode the limit to PRO
const PROJECT_LIMITS = {
  FREE: 1,
  PRO: 3,
} as const

export const projectRouter = createTRPCRouter({
  create: protectedActiveWorkspaceProcedure
    .input(createProjectSchema)
    .output(
      z.object({
        project: selectProjectSchema,
      })
    )
    .mutation(async (opts) => {
      const { name, url } = opts.input
      const workspace = opts.ctx.workspace

      const countProjectsWorkspace = await opts.ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.projects)
        .where(eq(schema.projects.workspaceId, workspace.id))
        .then((res) => res[0]?.count ?? 0)

      // TODO: Don't hardcode the limit to PRO
      if (countProjectsWorkspace >= PROJECT_LIMITS.PRO) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Limit reached" })
      }

      const projectId = utils.newIdEdge("project")
      const projectSlug = utils.generateSlug(2)

      const newProject = await opts.ctx.db
        .insert(schema.projects)
        .values({
          id: projectId,
          workspaceId: workspace.id,
          name,
          slug: projectSlug,
          url,
          tier: workspace.plan === "FREE" ? "FREE" : "PRO", // TODO: change this only apply when the user buy and addon for the project
        })
        .returning()
        .then((res) => res[0] ?? null)

      if (!newProject?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating project",
        })
      }

      return {
        project: newProject,
      }
    }),

  rename: protectedActiveWorkspaceAdminProcedure
    .input(renameProjectSchema)
    .output(
      z.object({
        project: selectProjectSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { name, slug } = opts.input

      const { project } = await projectGuard({
        projectSlug: slug,
        ctx: opts.ctx,
      })

      const projectRenamed = await opts.ctx.db
        .update(schema.projects)
        .set({
          name,
        })
        .where(eq(schema.projects.id, project.id))
        .returning()
        .then((res) => res[0] ?? undefined)

      return {
        project: projectRenamed,
      }
    }),

  delete: protectedActiveWorkspaceAdminProcedure
    .input(deleteProjectSchema)
    .output(
      z.object({
        project: selectProjectSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { slug: projectSlug } = opts.input

      const { project } = await projectGuard({
        projectSlug,
        ctx: opts.ctx,
      })

      const deletedProject = await opts.ctx.db
        .delete(schema.projects)
        .where(eq(schema.projects.id, project.id))
        .returning()
        .then((res) => res[0] ?? undefined)

      return {
        project: deletedProject,
      }
    }),

  // TODO: improve this
  canAccessProject: protectedProcedure
    .input(z.object({ slug: z.string(), needsToBeInTier: z.array(z.string()) }))
    .output(z.object({ haveAccess: z.boolean(), isInTier: z.boolean() }))
    .query(async (opts) => {
      const { slug: projectSlug, needsToBeInTier: tier } = opts.input

      try {
        const { project: projectData, workspace } = await projectGuard({
          projectSlug,
          ctx: opts.ctx,
        })

        if (tier.includes(workspace.plan)) {
          return {
            haveAccess: true,
            isInTier: true,
          }
        }

        return {
          haveAccess: projectData.slug === projectSlug,
          isInTier: tier.includes(workspace.plan),
        }
      } catch (error) {
        return { haveAccess: false, isInTier: false }
      }
    }),

  transferToPersonal: protectedActiveWorkspaceAdminProcedure
    .input(transferToPersonalProjectSchema)
    .output(
      z.object({
        project: selectProjectSchema.optional(),
        workspaceSlug: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      const { slug: projectSlug } = opts.input
      const userId = opts.ctx.userId

      const { project: projectData, workspace } = await projectGuard({
        projectSlug,
        ctx: opts.ctx,
      })

      if (workspace.isPersonal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Project is already in the personal workspace",
        })
      }

      const personalTargetWorkspace =
        await opts.ctx.db.query.workspaces.findFirst({
          columns: {
            id: true,
            slug: true,
          },
          where: (workspace, { eq, and }) =>
            and(
              eq(workspace.createdBy, userId),
              eq(workspace.isPersonal, true)
            ),
        })

      if (!personalTargetWorkspace?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "There is no personal workspace for the user",
        })
      }

      // TODO: do not hard code the limit - is it possible to reduce the queries?
      const projectsCount = await opts.ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.projects)
        .where(eq(schema.projects.workspaceId, personalTargetWorkspace.id))
        .then((res) => res[0]?.count ?? 0)

      // TODO: Don't hardcode the limit to PRO - the user is paying, should it be possible to transfer projects?
      if (projectsCount >= PROJECT_LIMITS.PRO) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The target workspace reached its limit of projects",
        })
      }

      // change the workspace for the project to personalTargetWorkspace
      const updatedProject = await opts.ctx.db
        .update(schema.projects)
        .set({
          workspaceId: personalTargetWorkspace.id,
        })
        .where(eq(schema.projects.id, projectData.id))
        .returning()
        .then((res) => res[0] ?? undefined)

      return {
        project: updatedProject,
        workspaceSlug: personalTargetWorkspace.slug,
      }
    }),

  // TODO: all this again
  transferToWorkspace: protectedActiveWorkspaceAdminProcedure
    .input(transferToWorkspaceSchema)
    .output(
      z.object({
        project: selectProjectSchema.optional(),
        workspaceSlug: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      const { targetWorkspaceId, projectSlug } = opts.input

      const { project: projectData, workspace } = await projectGuard({
        projectSlug,
        ctx: opts.ctx,
      })

      if (workspace.id === targetWorkspaceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Project is already in the target workspace",
        })
      }

      const targetWorkspace = await opts.ctx.db.query.workspaces.findFirst({
        columns: {
          id: true,
          slug: true,
        },
        with: {
          projects: true,
        },
        where: (workspace, { eq }) => eq(workspace.id, targetWorkspaceId),
      })

      if (!targetWorkspace?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "target workspace not found",
        })
      }

      // TODO: Don't hardcode the limit to PRO - the user is paying, should it be possible to transfer projects?
      if (targetWorkspace.projects.length >= PROJECT_LIMITS.PRO) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The target workspace reached its limit of projects",
        })
      }

      const updatedProject = await opts.ctx.db
        .update(schema.projects)
        .set({
          workspaceId: targetWorkspace.id,
        })
        .where(eq(schema.projects.id, projectData.id))
        .returning()
        .then((res) => res[0] ?? undefined)

      return {
        project: updatedProject,
        workspaceSlug: targetWorkspace.slug,
      }
    }),

  listByActiveWorkspace: protectedActiveWorkspaceProcedure
    .input(z.void())
    .output(
      z.object({
        projects: z.array(
          selectProjectSchema.extend({
            styles: z.object({
              backgroundImage: z.string(),
            }),
            workspace: selectWorkspaceSchema.pick({
              slug: true,
            }),
          })
        ),
        limit: z.number(),
        limitReached: z.boolean(),
      })
    )
    .query(async (opts) => {
      const activeWorkspaceId = opts.ctx.workspace.id

      const workspaceProjects = await opts.ctx.db.query.workspaces.findFirst({
        with: {
          projects: {
            orderBy: (project, { desc }) => [desc(project.createdAt)],
          },
        },
        where: (workspace, { eq }) => eq(workspace.id, activeWorkspaceId),
      })

      if (!workspaceProjects) {
        return {
          projects: [],
          limit: PROJECT_LIMITS.PRO,
          limitReached: false,
        }
      }

      const { projects, ...rest } = workspaceProjects

      // TODO: Don't hardcode the limit to PRO
      return {
        projects: projects.map((project) => ({
          ...project,
          workspace: rest,
          styles: getRandomPatternStyle(project.id),
        })),
        limit: PROJECT_LIMITS.PRO,
        limitReached: projects.length >= PROJECT_LIMITS.PRO,
      }
    }),
  listByWorkspace: protectedProcedure
    .input(z.object({ workspaceSlug: z.string() }))
    .output(
      z.object({
        projects: z.array(
          selectProjectSchema.extend({
            styles: z.object({
              backgroundImage: z.string(),
            }),
            workspace: selectWorkspaceSchema.pick({
              slug: true,
            }),
          })
        ),
        limit: z.number(),
        limitReached: z.boolean(),
      })
    )
    .query(async (opts) => {
      const { workspaceSlug } = opts.input

      const { workspace: workspaceData } = await workspaceGuard({
        workspaceSlug: workspaceSlug,
        ctx: opts.ctx,
      })

      const workspaceProjects = await opts.ctx.db.query.workspaces.findFirst({
        with: {
          projects: {
            orderBy: (project, { desc }) => [desc(project.createdAt)],
          },
        },
        where: (workspace, { eq }) => eq(workspace.id, workspaceData.id),
      })

      if (!workspaceProjects) {
        return {
          projects: [],
          limit: PROJECT_LIMITS.PRO,
          limitReached: false,
        }
      }

      const { projects, ...rest } = workspaceProjects

      // TODO: Don't hardcode the limit to PRO
      return {
        projects: projects.map((project) => ({
          ...project,
          workspace: rest,
          styles: getRandomPatternStyle(project.id),
        })),
        limit: PROJECT_LIMITS.PRO,
        limitReached: projects.length >= PROJECT_LIMITS.PRO,
      }
    }),
  getBySlug: protectedActiveWorkspaceProcedure
    .input(z.object({ slug: z.string() }))
    .output(
      z.object({
        project: selectProjectSchema.extend({
          workspace: selectWorkspaceSchema,
        }),
      })
    )
    .query(async (opts) => {
      const { slug: projectSlug } = opts.input

      const { project: projectData, workspace } = await projectGuard({
        projectSlug,
        ctx: opts.ctx,
      })

      return {
        project: {
          ...projectData,
          workspace: workspace,
        },
      }
    }),
  getById: protectedActiveWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        project: selectProjectSchema.extend({
          workspace: selectWorkspaceSchema,
        }),
      })
    )
    .query(async (opts) => {
      const { id: projectId } = opts.input

      const { project: projectData, workspace } = await projectGuard({
        projectId,
        ctx: opts.ctx,
      })

      return {
        project: {
          ...projectData,
          workspace: workspace,
        },
      }
    }),
})
