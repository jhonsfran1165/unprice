import { customerEntitlementsSchema } from "@unprice/db/validators"
import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { protectedWorkspaceProcedure } from "#trpc"
import { getEntitlements } from "#utils/shared"

export const getUsageActiveEntitlementsCustomerUnprice = protectedWorkspaceProcedure
  .input(
    z.object({
      customerId: z.string(),
    })
  )
  .output(
    z.object({
      entitlements: customerEntitlementsSchema.array().nullable(),
    })
  )
  .query(async (opts) => {
    const { err, val } = await getEntitlements({
      customerId: opts.input.customerId,
      projectId: opts.ctx.workspace.id,
      ctx: opts.ctx,
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    return {
      entitlements: val,
    }
  })
