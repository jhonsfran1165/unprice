import { protectedWorkspaceProcedure } from "#/trpc"
import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { workspaceSelectBase } from "@unprice/db/validators"

export const rename = protectedWorkspaceProcedure
  .input(workspaceSelectBase.pick({ name: true }))
  .output(workspaceSelectBase)
  .mutation(async (opts) => {
    const { name } = opts.input
    const workspace = opts.ctx.workspace

    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const workspaceRenamed = await opts.ctx.db
      .update(schema.workspaces)
      .set({ name })
      .where(eq(schema.workspaces.id, workspace.id))
      .returning()
      .then((wk) => wk[0] ?? undefined)

    if (!workspaceRenamed) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating workspace",
      })
    }

    return workspaceRenamed
  })
