import type { FeatureType } from "@unprice/db/validators"
import { z } from "zod"
import { deniedReasonSchema } from "#services/customers/errors"
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
  .output(
    z.object({
      access: z.boolean(),
      deniedReason: deniedReasonSchema.optional().nullable(),
      currentUsage: z.number().optional(),
      limit: z.number().optional(),
      featureType: z.custom<FeatureType>().optional(),
      units: z.number().optional(),
    })
  )
  .query(async (opts) => {
    const { customerId, featureSlug } = opts.input

    return await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      throwOnNoAccess: true,
    })
  })
