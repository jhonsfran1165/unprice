import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
import { reportUsageFeature } from "#utils/shared"

export const remove = protectedProjectProcedure
  .input(pageSelectBaseSchema.pick({ id: true }))
  .output(z.object({ page: pageSelectBaseSchema }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project
    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "pages"

    // only owner can delete a page
    opts.ctx.verifyRole(["OWNER"])

    // check if the customer has access to the feature
    const result = await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      updateUsage: true,
      isInternal: workspace.isInternal,
    })

    if (!result.access) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

    const deletedPage = await opts.ctx.db
      .delete(schema.pages)
      .where(and(eq(schema.pages.projectId, project.id), eq(schema.pages.id, id)))
      .returning()
      .then((data) => data[0])

    if (!deletedPage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting page",
      })
    }

    opts.ctx.waitUntil(
      // report usage for the new project in background
      reportUsageFeature({
        customerId,
        featureSlug,
        usage: -1, // the deleted project
        ctx: opts.ctx,
        isInternal: workspace.isInternal,
      })
    )

    return {
      page: deletedPage,
    }
  })
