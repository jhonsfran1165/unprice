import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { clerkClient } from "@builderai/auth"
import { eq, getTableColumns, schema, sql, utils } from "@builderai/db"
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
  protectedOrgAdminProcedure,
  protectedOrgProcedure,
  protectedProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"
import { getRandomPatternStyle } from "../../utils/generate-pattern"

// TODO: Don't hardcode the limit to PRO
const PROJECT_LIMITS = {
  FREE: 1,
  PRO: 3,
} as const

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createProjectSchema)
    .output(
      z.object({
        project: selectProjectSchema,
      })
    )
    .mutation(async (opts) => {
      const tenantId = opts.ctx.tenantId
      const { name, url } = opts.input

      const projects = await opts.ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.projects)

      // TODO: Don't hardcode the limit to PRO
      if (projects[0] && projects[0].count >= PROJECT_LIMITS.PRO) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Limit reached" })
      }

      const workspace = await opts.ctx.db.query.workspaces.findFirst({
        columns: {
          id: true,
          plan: true,
        },
        where: (workspace, { eq }) => eq(workspace.tenantId, tenantId),
      })

      if (!workspace?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace don't exist",
        })
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
          tier: workspace.plan === "free" ? "free" : "pro",
        })
        .returning()

      if (!newProject?.[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating project",
        })
      }

      return {
        project: newProject?.[0],
      }
    }),

  rename: protectedOrgAdminProcedure
    .input(renameProjectSchema)
    .output(
      z.object({
        project: selectProjectSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { projectSlug, name } = opts.input

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const projectRenamed = await opts.ctx.db
        .update(schema.projects)
        .set({
          name,
        })
        .where(eq(schema.projects.id, projectData.id))
        .returning()

      return {
        project: projectRenamed?.[0],
      }
    }),

  delete: protectedOrgAdminProcedure
    .input(deleteProjectSchema)
    .output(
      z.object({
        project: selectProjectSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { slug: projectSlug } = opts.input

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const deletedProject = await opts.ctx.db
        .delete(schema.projects)
        .where(eq(schema.projects.id, projectData.id))
        .returning()

      return {
        project: deletedProject?.[0],
      }
    }),

  // TODO: improve this
  canAccessProject: protectedOrgAdminProcedure
    .input(z.object({ slug: z.string(), needsToBeInTier: z.array(z.string()) }))
    .output(z.object({ haveAccess: z.boolean(), isInTier: z.boolean() }))
    .query(async (opts) => {
      const { slug: projectSlug, needsToBeInTier: tier } = opts.input

      try {
        const { project: projectData } = await hasAccessToProject({
          projectSlug,
          ctx: opts.ctx,
        })

        if (tier.includes("FREE")) {
          return {
            haveAccess: true,
            isInTier: true,
          }
        }

        return {
          haveAccess: projectData.slug === projectSlug,
          isInTier: tier.includes(projectData.tier ?? "FREE"),
        }
      } catch (error) {
        return { haveAccess: false, isInTier: false }
      }
    }),

  transferToPersonal: protectedOrgAdminProcedure
    .input(transferToPersonalProjectSchema)
    .output(
      z.object({
        project: selectProjectSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { slug: projectSlug } = opts.input
      const { userId } = opts.ctx.auth

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      if (projectData.workspace.isPersonal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Project is already personal",
        })
      }

      const personalTargetWorkspace =
        await opts.ctx.db.query.workspaces.findFirst({
          columns: {
            id: true,
            tenantId: true,
          },
          where: (workspace, { eq }) => eq(workspace.tenantId, userId),
        })

      if (!personalTargetWorkspace?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The target workspace doesn't exist",
        })
      }

      // TODO: do not hard code the limit - is it possible to reduce the queries?
      const projects = await opts.ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.projects)
        .where(eq(schema.projects.workspaceId, personalTargetWorkspace.id))

      // TODO: Don't hardcode the limit to PRO - the user is paying, should it be possible to transfer projects?
      if (projects[0] && projects[0].count >= PROJECT_LIMITS.PRO) {
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

      return {
        project: updatedProject?.[0],
      }
    }),
  transferToWorkspace: protectedOrgAdminProcedure
    .input(transferToWorkspaceSchema)
    .output(
      z.object({
        project: selectProjectSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { userId } = opts.ctx.auth
      const { tenantId: targetTenantId, projectSlug } = opts.input

      const orgs = await clerkClient.users.getOrganizationMembershipList({
        userId: userId,
      })

      const targetOrg = orgs.find(
        (org) => org.organization.id === targetTenantId
      )

      if (!targetOrg?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You're not a member of the target organization",
        })
      }

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      if (projectData.workspace.tenantId === targetTenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Project is already in the target organization",
        })
      }

      const targetWorkspace = await opts.ctx.db.query.workspaces.findFirst({
        columns: {
          id: true,
          tenantId: true,
        },
        where: (workspace, { eq }) => eq(workspace.tenantId, targetTenantId),
      })

      if (!targetWorkspace?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "target workspace not found",
        })
      }

      const updatedProject = await opts.ctx.db
        .update(schema.projects)
        .set({
          workspaceId: targetWorkspace.id,
        })
        .where(eq(schema.projects.id, projectData.id))
        .returning()

      return {
        project: updatedProject?.[0],
      }
    }),

  listByWorkspace: protectedOrgProcedure
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
      const { ...rest } = getTableColumns(schema.projects)
      const workspaceProjects = await opts.ctx.db
        .select({
          project: {
            ...rest,
          },
          workspace: {
            slug: schema.workspaces.slug,
          },
        })
        .from(schema.projects)
        .innerJoin(
          schema.workspaces,
          eq(schema.projects.workspaceId, schema.workspaces.id)
        )
        .where(eq(schema.workspaces.slug, opts.input.workspaceSlug))

      // TODO: Don't hardcode the limit to PRO
      return {
        projects: workspaceProjects.map((project) => ({
          ...project.project,
          workspace: project.workspace,
          styles: getRandomPatternStyle(project.project.id),
        })),
        limit: PROJECT_LIMITS.PRO,
        limitReached: workspaceProjects.length >= PROJECT_LIMITS.PRO,
      }
    }),
  bySlug: protectedOrgProcedure
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

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      return {
        project: projectData,
      }
    }),
  byId: protectedOrgProcedure
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

      const { project: projectData } = await hasAccessToProject({
        projectId,
        ctx: opts.ctx,
      })

      return {
        project: projectData,
      }
    }),
})
