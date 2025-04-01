import { customerEntitlementSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedWorkspaceProcedure } from "#trpc"
import { getEntitlements } from "#utils/shared"

export const entitlements = protectedWorkspaceProcedure
  .input(
    z.object({
      customerId: z.string(),
      skipCache: z.boolean().optional(),
    })
  )
  .output(
    z.object({
      entitlements: customerEntitlementSchema.array(),
    })
  )
  .query(async (opts) => {
    const { customerId } = opts.input
    const isInternal = opts.ctx.workspace?.isInternal

    if (isInternal) {
      return {
        entitlements: [],
      }
    }

    const res = await getEntitlements({
      customerId,
      ctx: opts.ctx,
      skipCache: opts.input.skipCache,
      updateUsage: false,
    })

    return {
      entitlements: res,
    }
  })
