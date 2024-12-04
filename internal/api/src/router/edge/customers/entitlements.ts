import { customerEntitlementSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"
import { getEntitlements } from "../../../utils/shared"

export const entitlements = protectedApiOrActiveProjectProcedure
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
    const { apiKey, ...ctx } = opts.ctx
    const projectId = apiKey.projectId

    const res = await getEntitlements({
      customerId,
      projectId: projectId,
      ctx,
    })

    return {
      entitlements: res,
    }
  })
