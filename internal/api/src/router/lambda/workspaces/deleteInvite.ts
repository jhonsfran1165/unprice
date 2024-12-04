import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { invitesSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"

export const deleteInvite = protectedWorkspaceProcedure
  .input(
    z.object({
      email: z.string().email(),
    })
  )
  .output(
    z.object({
      invite: invitesSelectBase,
    })
  )
  .mutation(async (opts) => {
    const { email } = opts.input
    const workspace = opts.ctx.workspace

    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      })
    }

    const deletedInvite = await opts.ctx.db
      .delete(schema.invites)
      .where(and(eq(schema.invites.email, email), eq(schema.invites.workspaceId, workspace.id)))
      .returning()
      .then((inv) => inv[0] ?? undefined)

    if (!deletedInvite) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting invite",
      })
    }

    return {
      invite: deletedInvite,
    }
  })
