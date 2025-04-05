import { customerEntitlementsSchema } from "@unprice/db/validators"
import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { protectedProjectProcedure } from "#trpc"
import { getEntitlements } from "#utils/shared"

export const getUsageActiveEntitlementsCustomer = protectedProjectProcedure
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
    const { customerId } = opts.input

    const { err, val } = await getEntitlements({
      customerId,
      projectId: opts.ctx.project.id,
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
