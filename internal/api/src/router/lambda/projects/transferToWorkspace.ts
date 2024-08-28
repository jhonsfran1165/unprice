import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { projectSelectBaseSchema, transferToWorkspaceSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"
import { projectWorkspaceGuard } from "../../../utils"

// TODO: Don't hardcode the limit to PRO
const PROJECT_LIMITS = {
  FREE: 1,
  PRO: 3,
} as const
export const transferToWorkspace = protectedWorkspaceProcedure
  .input(transferToWorkspaceSchema)
  .output(
    z.object({
      project: projectSelectBaseSchema.optional(),
      workspaceSlug: z.string().optional(),
    })
  )
  .mutation(async (opts) => {
    const { targetWorkspaceId, projectSlug } = opts.input

    // only owner and admin can transfer a project to a workspace
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const { project: projectData } = await projectWorkspaceGuard({
      projectSlug,
      ctx: opts.ctx,
    })

    if (projectData.isMain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot transfer main project",
      })
    }

    if (projectData.workspaceId === targetWorkspaceId) {
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
  })
