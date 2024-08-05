import { type Database, eq } from "@unprice/db"
import { apiKeyPrepared } from "@unprice/db/queries"
import * as schema from "@unprice/db/schema"
import { hashStringSHA256 } from "@unprice/db/utils"
import type { ApiKeyExtended } from "@unprice/db/validators"
import { FetchError, type Result } from "@unprice/error"
import { Err, Ok } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache } from "./cache"
import { UnPriceApiKeyError } from "./errors"
import type { Metrics } from "./metrics"

export class UnpriceApiKey {
  private readonly cache: Cache
  private readonly db: Database
  private readonly metrics: Metrics
  private readonly logger: Logger
  private readonly waitUntil: (p: Promise<unknown>) => void
  private readonly analytics: Analytics

  constructor(opts: {
    cache: Cache
    metrics: Metrics
    db: Database
    analytics: Analytics
    logger: Logger
    waitUntil: (p: Promise<unknown>) => void
  }) {
    this.cache = opts.cache
    this.db = opts.db
    this.metrics = opts.metrics
    this.analytics = opts.analytics
    this.logger = opts.logger
    this.waitUntil = opts.waitUntil
  }

  private async _getApiKey(opts: {
    key: string
  }): Promise<Result<ApiKeyExtended, UnPriceApiKeyError | FetchError>> {
    const apiKeyHash = await hashStringSHA256(opts.key)
    const res = await this.cache.apiKeyByHash.swr(apiKeyHash, async () => {
      return await apiKeyPrepared.execute({
        apikey: opts.key,
      })
    })

    if (res.err) {
      this.logger.error(`Error in _getApiKey: ${res.err.message}`, {
        error: JSON.stringify(res.err),
        apiKeyHash: apiKeyHash,
      })

      return Err(
        new FetchError({
          message: "unable to fetch required data",
          retry: true,
          cause: res.err,
        })
      )
    }

    // cache miss, get from db
    if (!res.val) {
      const apikey = await apiKeyPrepared.execute({
        apikey: opts.key,
      })

      if (!apikey) {
        return Err(
          new UnPriceApiKeyError({
            code: "NOT_FOUND",
          })
        )
      }

      // save the data in the cache
      this.waitUntil(this.cache.apiKeyByHash.set(`${apiKeyHash}`, apikey))

      return Ok(apikey)
    }

    return Ok(res.val)
  }

  public async getApiKey(opts: {
    key: string
  }): Promise<Result<ApiKeyExtended, UnPriceApiKeyError | FetchError>> {
    try {
      const { key } = opts

      const result = await this._getApiKey({
        key,
      })

      if (result.err) {
        return result
      }

      const apiKey = result.val

      if (apiKey.revokedAt !== null) {
        return Err(
          new UnPriceApiKeyError({
            code: "REVOKED",
          })
        )
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return Err(
          new UnPriceApiKeyError({
            code: "EXPIRED",
          })
        )
      }

      if (apiKey.project.enabled === false) {
        return Err(
          new UnPriceApiKeyError({
            code: "PROJECT_DISABLED",
          })
        )
      }

      if (apiKey.project.workspace.enabled === false) {
        return Err(
          new UnPriceApiKeyError({
            code: "WORKSPACE_DISABLED",
          })
        )
      }

      this.waitUntil(
        Promise.all([
          // update last used in background
          this.db
            .update(schema.apikeys)
            .set({
              lastUsed: new Date(),
            })
            .where(eq(schema.apikeys.id, apiKey.id))
            .execute(),
          // TODO: report usage of this feature
        ])
      )

      return Ok(apiKey)
    } catch (e) {
      const error = e as Error
      this.logger.error("Unhandled error while getting the apikey", {
        error: JSON.stringify(error),
      })

      return Err(
        new UnPriceApiKeyError({
          code: "UNHANDLED_ERROR",
        })
      )
    }
  }
}
