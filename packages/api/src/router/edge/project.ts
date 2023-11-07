import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { clerkClient } from "@builderai/auth"
import { eq, sql } from "@builderai/db"
import {
  createProjectSchema,
  deleteProjectSchema,
  project,
  renameProjectSchema,
  transferToPersonalProjectSchema,
  transferToWorkspaceSchema,
} from "@builderai/db/schema/project"
import { generateSlug, newIdEdge } from "@builderai/db/utils"

import {
  createTRPCRouter,
  protectedOrgAdminProcedure,
  protectedOrgProcedure,
  protectedProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"

const PROJECT_LIMITS = {
  FREE: 1,
  PRO: 3,
} as const

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async (opts) => {
      const tenantId = opts.ctx.tenantId
      const { name, url } = opts.input

      // activate RLS
      await opts.ctx.activateRLS()

      const projects = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.select({ count: sql<number>`count(*)` }).from(project)
      })

      // TODO: Don't hardcode the limit to PRO
      if (projects[0] && projects[0].count >= PROJECT_LIMITS.PRO) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Limit reached" })
      }

      const workspace = await opts.ctx.db.query.workspace.findFirst({
        columns: {
          id: true,
        },
        where: (workspace, { eq }) => eq(workspace.tenantId, tenantId),
      })

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace don't exist",
        })
      }

      const projectId = newIdEdge("project")
      const projectSlug = generateSlug(2)

      await opts.ctx.db.insert(project).values({
        id: projectId,
        name,
        slug: projectSlug,
        url,
        workspaceId: workspace.id,
        tenantId: opts.ctx.tenantId,
      })

      // deactivate RLS
      await opts.ctx.deactivateRLS()

      return { projectId, projectSlug, name, url }
    }),

  rename: protectedOrgAdminProcedure
    .input(renameProjectSchema)
    .mutation(async (opts) => {
      const { projectSlug, name } = opts.input

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const projectRenamed = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS
          .update(project)
          .set({
            name,
          })
          .where(eq(project.id, projectData.id))
          .returning()
      })

      return projectRenamed[0]
    }),

  delete: protectedOrgAdminProcedure
    .input(deleteProjectSchema)
    .mutation(async (opts) => {
      const { slug: projectSlug } = opts.input

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.delete(project).where(eq(project.id, projectData.id))
      })
    }),

  canAccessProject: protectedOrgAdminProcedure
    .input(z.object({ slug: z.string() }))
    .query(async (opts) => {
      const { slug: projectSlug } = opts.input

      try {
        const { project: projectData } = await hasAccessToProject({
          projectSlug,
          ctx: opts.ctx,
        })

        return { haveAccess: projectData.slug === projectSlug }
      } catch (error) {
        return { haveAccess: false }
      }
    }),

  transferToPersonal: protectedOrgAdminProcedure
    .input(transferToPersonalProjectSchema)
    .mutation(async (opts) => {
      const { slug: projectSlug } = opts.input
      const { userId } = opts.ctx.auth

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      if (projectData.workspace.isPersonal ?? projectData.tenantId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Project is already personal",
        })
      }

      // get info of the target workspace - bypass RLS to get the workspace from another tenantId
      const personalTargetWorkspace =
        await opts.ctx.db.query.workspace.findFirst({
          columns: {
            id: true,
            tenantId: true,
          },
          where: (workspace, { eq }) => eq(workspace.tenantId, userId),
        })

      if (!personalTargetWorkspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The target workspace doesn't exist",
        })
      }

      // TODO: do not hard code the limit - is it possible to reduce the queries?
      const projects = await opts.ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(project)
        .where(eq(project.workspaceId, personalTargetWorkspace.id))

      // TODO: Don't hardcode the limit to PRO - the user is paying, should it be possible to transfer projects?
      if (projects[0] && projects[0].count >= PROJECT_LIMITS.PRO) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The target workspace reached its limit of projects",
        })
      }

      // execute on a transaction for updating the owner of the project
      await opts.ctx.db.transaction(async (tx) => {
        try {
          // change the workspace for the project to personalTargetWorkspace
          await tx
            .update(project)
            .set({
              tenantId: userId,
              workspaceId: personalTargetWorkspace.id,
            })
            .where(eq(project.id, projectData.id))

          // execute procedure to update tenant id on all tables of this project
          await tx.execute(
            sql.raw(
              `SELECT update_tenant('${projectData.workspace.tenantId}', '${personalTargetWorkspace.tenantId}', '${projectData.id}')`
            )
          )

          // TODO: handle rollback if something goes wrong
          // if (data.rows) {
          //   await tx.rollback()
          //   return
          // }
        } catch (error) {
          console.error(error)
          tx.rollback()
          return
        }
      })
    }),
  transferToWorkspace: protectedOrgAdminProcedure
    .input(transferToWorkspaceSchema)
    .mutation(async (opts) => {
      const { userId } = opts.ctx.auth
      const { tenantId: targetTenantId, projectSlug } = opts.input

      const orgs = await clerkClient.users.getOrganizationMembershipList({
        userId: userId,
      })

      const targetOrg = orgs.find(
        (org) => org.organization.id === targetTenantId
      )

      if (!targetOrg) {
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

      // get info of the target workspace - bypass RLS to get from another tenantId
      const targetWorkspace = await opts.ctx.db.query.workspace.findFirst({
        columns: {
          id: true,
          tenantId: true,
        },
        where: (workspace, { eq }) => eq(workspace.tenantId, targetTenantId),
      })

      if (!targetWorkspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "target workspace not found",
        })
      }

      // execute on a transaction for updating the owner of the project
      await opts.ctx.db.transaction(async (tx) => {
        try {
          // change the workspace for the project to personalTargetWorkspace
          await tx
            .update(project)
            .set({
              tenantId: targetTenantId,
              workspaceId: targetWorkspace.id,
            })
            .where(eq(project.id, projectData.id))

          // execute function to update tenant id on all tables of this project
          await tx.execute(
            sql.raw(
              `SELECT update_tenant('${projectData.workspace.tenantId}', '${targetWorkspace.tenantId}', '${projectData.id}')`
            )
          )
        } catch (error) {
          console.error(error)
          tx.rollback()
          return
        }
      })
    }),

  listByActiveWorkspace: protectedOrgProcedure.query(async (opts) => {
    const projects = await opts.ctx.txRLS(({ txRLS }) =>
      txRLS.query.project.findMany({
        columns: {
          name: true,
          id: true,
          url: true,
          tier: true,
          slug: true,
        },
        with: {
          workspace: {
            columns: {
              slug: true,
            },
          },
        },
      })
    )

    // FIXME: Don't hardcode the limit to PRO
    return {
      projects,
      limit: PROJECT_LIMITS.PRO,
      limitReached: projects.length >= PROJECT_LIMITS.PRO,
    }
  }),
  bySlug: protectedOrgProcedure
    .input(z.object({ slug: z.string() }))
    .query(async (opts) => {
      const { slug: projectSlug } = opts.input

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      return projectData
    }),
  byId: protectedOrgProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const { id: projectId } = opts.input

      const { project: projectData } = await hasAccessToProject({
        projectId,
        ctx: opts.ctx,
      })

      return projectData
    }),
})
