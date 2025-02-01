import { protectedApiOrActiveWorkspaceProcedure } from "#/trpc"
import { reportUsageFeature } from "#/utils/shared"
import * as utils from "@unprice/db/utils"
import { z } from "zod"

export const reportUsage = protectedApiOrActiveWorkspaceProcedure
  .meta({
    span: "customers.reportUsage",
    openapi: {
      method: "GET",
      path: "/edge/customers.reportUsage",
      protect: true,
    },
  })
  .input(
    z.object({
      customerId: z.string(),
      featureSlug: z.string(),
      usage: z.number(),
      idempotenceKey: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
      cacheHit: z.boolean().optional(),
    })
  )
  .query(async (opts) => {
    const { customerId, featureSlug, usage, idempotenceKey } = opts.input

    // this is to avoid reporting the same usage multiple times
    const body = JSON.stringify({ customerId, featureSlug, usage, idempotenceKey })
    const hashKey = await utils.hashStringSHA256(body)

    // get result if it exists
    const result = await opts.ctx.cache.idempotentRequestUsageByHash.get(hashKey)

    if (result.val) {
      return {
        success: result.val.access,
        message: result.val.message,
        cacheHit: true,
      }
    }

    // if cache miss, report usage
    const response = await reportUsageFeature({
      customerId,
      featureSlug,
      usage: usage,
      ctx: opts.ctx,
    })

    // cache the result
    opts.ctx.waitUntil(
      opts.ctx.cache.idempotentRequestUsageByHash.set(hashKey, {
        access: response.success,
        message: response.message,
      })
    )

    return {
      ...response,
    }
  })
