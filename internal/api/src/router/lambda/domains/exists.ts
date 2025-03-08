import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const exists = protectedWorkspaceProcedure
  .input(z.object({ domain: z.string() }))
  .output(z.object({ exist: z.boolean() }))
  .mutation(async (opts) => {
    const workspace = opts.ctx.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "domains"

    // check if the customer has access to the feature
    const result = await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
    })

    if (result.deniedReason === "FEATURE_NOT_FOUND_IN_SUBSCRIPTION") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

    const domain = await opts.ctx.db.query.domains.findFirst({
      where: (d, { eq }) => eq(d.name, opts.input.domain),
    })

    return {
      exist: !!domain,
    }
  })
