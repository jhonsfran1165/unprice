import { customerEntitlementSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedApiOrActiveProjectProcedure } from "#/trpc"
import { getEntitlements } from "#/utils/shared"

export const getUsageActiveEntitlementsCustomer = protectedApiOrActiveProjectProcedure
  .input(
    z.object({
      customerId: z.string(),
    })
  )
  .output(
    z.object({
      entitlements: customerEntitlementSchema
        .omit({
          createdAtM: true,
          updatedAtM: true,
        })
        .array(),
    })
  )
  .query(async (opts) => {
    const { customerId } = opts.input

    const entitlements = await getEntitlements({
      customerId,
      ctx: opts.ctx,
      includeCustom: true,
      updateUsage: false,
    })

    return {
      entitlements: entitlements,
    }
  })
