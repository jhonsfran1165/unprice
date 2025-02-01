import { customerEntitlementSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedApiOrActiveWorkspaceProcedure } from "#/trpc"
import { getEntitlements } from "#/utils/shared"

export const entitlements = protectedApiOrActiveWorkspaceProcedure
  .meta({
    span: "customers.entitlements",
    openapi: {
      method: "GET",
      path: "/edge/customers.entitlements",
      protect: true,
    },
  })
  .input(
    z.object({
      customerId: z.string(),
      skipCache: z.boolean().optional(),
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
