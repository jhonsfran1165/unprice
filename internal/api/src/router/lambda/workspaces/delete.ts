import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"
import { signOutCustomer } from "../../../utils/shared"

export const deleteWorkspace = protectedWorkspaceProcedure
  .input(workspaceSelectBase.pick({ id: true }))
  .output(z.object({ workspace: workspaceSelectBase.optional() }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const workspace = opts.ctx.workspace

    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    if (workspace.isMain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete main workspace",
      })
    }

    if (workspace.id !== id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This id is not the active workspace",
      })
    }

    if (workspace?.isPersonal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete personal workspace. Contact support to delete your account.",
      })
    }

    const mainProject = await opts.ctx.db.query.projects.findFirst({
      where: eq(schema.projects.isMain, true),
    })

    if (!mainProject) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Main project not found",
      })
    }

    const result = await signOutCustomer({
      input: {
        customerId: workspace.unPriceCustomerId,
        projectId: mainProject.id,
      },
      ctx: opts.ctx,
    })

    if (!result.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.message,
      })
    }

    const deletedWorkspace = await opts.ctx.db
      .update(schema.workspaces)
      .set({
        enabled: false,
      })
      .where(eq(schema.workspaces.id, workspace.id))
      .returning()
      .then((wk) => wk[0] ?? undefined)

    if (!deletedWorkspace) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting workspace",
      })
    }

    return {
      workspace: deletedWorkspace,
    }
  })
