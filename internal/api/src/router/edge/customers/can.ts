import { featureVerificationSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveWorkspaceProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const can = protectedApiOrActiveWorkspaceProcedure
  .meta({
    span: "customers.can",
    openapi: {
      method: "GET",
      path: "/edge/customers.can",
      protect: true,
    },
  })
  .input(
    z.object({
      customerId: z.string(),
      featureSlug: z.string(),
    })
  )
  .output(featureVerificationSchema)
  .query(async (opts) => {
    const { customerId, featureSlug } = opts.input

    return await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
    })
  })
