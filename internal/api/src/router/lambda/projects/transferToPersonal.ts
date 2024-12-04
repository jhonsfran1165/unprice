import { TRPCError } from "@trpc/server"
import { eq, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { projectSelectBaseSchema, transferToPersonalProjectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"
import { projectWorkspaceGuard } from "../../../utils"

// TODO: Don't hardcode the limit to PRO
const PROJECT_LIMITS = {
  FREE: 1,
  PRO: 3,
} as const

export const transferToPersonal = protectedWorkspaceProcedure
  .input(transferToPersonalProjectSchema)
  .output(
    z.object({
      project: projectSelectBaseSchema.optional(),
      workspaceSlug: z.string().optional(),
    })
  )
  .mutation(async (opts) => {
    const { slug: projectSlug } = opts.input
    const userId = opts.ctx.userId

    // only owner and admin can transfer a project to personal
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const { project: projectData } = await projectWorkspaceGuard({
      projectSlug,
      ctx: opts.ctx,
    })

    if (projectData.workspace.isPersonal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Project is already in the personal workspace",
      })
    }

    if (projectData.isMain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot transfer main project",
      })
    }

    const personalTargetWorkspace = await opts.ctx.db.query.workspaces.findFirst({
      columns: {
        id: true,
        slug: true,
      },
      where: (workspace, { eq, and }) =>
        and(eq(workspace.createdBy, userId), eq(workspace.isPersonal, true)),
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
  })
