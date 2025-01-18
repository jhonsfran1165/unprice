import { customerEntitlementSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"
import { getEntitlements } from "../../../utils/shared"

export const getUsageActiveEntitlementsCustomerUnprice = protectedWorkspaceProcedure
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
      noCache: true,
      updateUsage: true,
    })

    return {
      entitlements,
    }
  })
