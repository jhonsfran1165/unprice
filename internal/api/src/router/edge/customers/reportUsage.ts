import * as utils from "@unprice/db/utils"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"
import { reportUsageFeature } from "../../../utils/shared"

export const reportUsage = protectedApiOrActiveProjectProcedure
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
    const projectId = opts.ctx.project.id
    const workspaceId = opts.ctx.project.workspaceId

    // this is to avoid reporting the same usage multiple times
    const body = JSON.stringify({ customerId, featureSlug, usage, idempotenceKey, projectId })
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
    const { apiKey, ...ctx } = opts.ctx

    const response = await reportUsageFeature({
      customerId,
      featureSlug,
      projectId: projectId,
      workspaceId: workspaceId,
      usage: usage,
      ctx,
    })

    // cache the result
    ctx.waitUntil(
      opts.ctx.cache.idempotentRequestUsageByHash.set(hashKey, {
        access: response.success,
        message: response.message,
      })
    )

    return {
      ...response,
    }
  })
