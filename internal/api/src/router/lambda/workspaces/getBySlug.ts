import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"

export const getBySlug = protectedWorkspaceProcedure
  .input(workspaceSelectBase.pick({ slug: true }))
  .output(
    z.object({
      workspace: workspaceSelectBase,
    })
  )
  .query(async (opts) => {
    const { slug } = opts.input

    const workspace = await opts.ctx.db.query.workspaces.findFirst({
      where: eq(schema.workspaces.slug, slug),
    })

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      })
    }

    return {
      workspace: workspace,
    }
  })
