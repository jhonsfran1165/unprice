import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { membersSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"

export const deleteMember = protectedWorkspaceProcedure
  .input(
    z.object({
      userId: z.string(),
      workspaceId: z.string(),
    })
  )
  .output(
    z.object({
      member: membersSelectBase,
    })
  )
  .mutation(async (opts) => {
    const { userId, workspaceId } = opts.input
    const workspace = opts.ctx.workspace

    opts.ctx.verifyRole(["OWNER"])

    if (workspace.id !== workspaceId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Workspace not found",
      })
    }

    if (workspace.isPersonal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete yourself from personal workspace",
      })
    }

    const user = await opts.ctx.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    })

    if (!user?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      })
    }

    const ownerCount = await opts.ctx.db.query.workspaces.findFirst({
      with: {
        members: true,
      },
      where: (workspace, operators) => operators.and(operators.eq(workspace.id, workspaceId)),
    })

    if (ownerCount && ownerCount.members.length <= 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete the only owner of the workspace",
      })
    }

    const deletedMember = await opts.ctx.db
      .delete(schema.members)
      .where(and(eq(schema.members.workspaceId, workspace.id), eq(schema.members.userId, user.id)))
      .returning()
      .then((members) => members[0] ?? undefined)

    if (!deletedMember) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting member",
      })
    }

    return {
      member: deletedMember,
    }
  })
