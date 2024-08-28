import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { membersSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"

export const changeRoleMember = protectedWorkspaceProcedure
  .input(membersSelectBase.pick({ userId: true, role: true }))
  .output(z.object({ member: membersSelectBase.optional() }))
  .mutation(async (opts) => {
    const { userId, role } = opts.input
    const workspace = opts.ctx.workspace

    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const member = await opts.ctx.db
      .update(schema.members)
      .set({ role })
      .where(and(eq(schema.members.workspaceId, workspace.id), eq(schema.members.userId, userId)))
      .returning()
      .then((wk) => wk[0] ?? undefined)

    if (!member) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating workspace",
      })
    }

    return {
      member: member,
    }
  })
