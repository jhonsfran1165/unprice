import { TRPCError } from "@trpc/server"

import type { Database } from "@unprice/db"
import { ApiKeysService, UnPriceApiKeyError } from "@unprice/services/apikeys"
import type { Context } from "../trpc"

export const apikeyGuard = async ({
  apikey,
  ctx,
}: {
  apikey?: string | null
  ctx: Context
}) => {
  if (!apikey) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Api key not found in headers",
    })
  }

  const ApiKey = new ApiKeysService({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  const apiKeyData = await ApiKey.getApiKey({
    key: apikey,
  })

  if (apiKeyData.err) {
    const err = apiKeyData.err
    switch (true) {
      case err instanceof UnPriceApiKeyError:
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error getting apikey: ${err.toString()}`,
        })
    }
  }

  return {
    apiKey: apiKeyData.val,
  }
}
