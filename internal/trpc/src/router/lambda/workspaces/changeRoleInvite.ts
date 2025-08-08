import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { invitesSelectBase } from "@unprice/db/validators"
import { z } from "zod"

import { protectedWorkspaceProcedure } from "#trpc"

export const changeRoleInvite = protectedWorkspaceProcedure
  .input(invitesSelectBase.pick({ email: true, role: true }))
  .output(z.object({ invite: invitesSelectBase.optional() }))
  .mutation(async (opts) => {
    const { email, role } = opts.input
    const workspace = opts.ctx.workspace

    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const invite = await opts.ctx.db
      .update(schema.invites)
      .set({ role })
      .where(and(eq(schema.invites.workspaceId, workspace.id), eq(schema.invites.email, email)))
      .returning()
      .then((wk) => wk[0] ?? undefined)

    if (!invite) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating role for invite",
      })
    }

    return {
      invite: invite,
    }
  })
