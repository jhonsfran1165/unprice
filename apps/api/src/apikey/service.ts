import { hashStringSHA256 } from "@unprice/db/utils"
import type { ApiKeyExtended } from "@unprice/db/validators"
import { Err, FetchError, Ok, type Result, type SchemaError, wrapResult } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Cache } from "@unprice/services/cache"
import type { Metrics } from "@unprice/services/metrics"
import type { Analytics } from "@unprice/tinybird"

import type { Database } from "@unprice/db"
import type { Context } from "~/hono/app"
import { retry } from "~/util/retry"
import { UnPriceApiKeyError } from "./errors"

export class ApiKeysService {
  private readonly cache: Cache
  private readonly metrics: Metrics
  private readonly logger: Logger
  private readonly analytics: Analytics
  private readonly hashCache = new Map<string, string>()
  private readonly db: Database

  constructor(opts: {
    cache: Cache
    metrics: Metrics
    analytics: Analytics
    logger: Logger
    db: Database
  }) {
    this.cache = opts.cache
    this.metrics = opts.metrics
    this.analytics = opts.analytics
    this.logger = opts.logger
    this.db = opts.db
  }

  private async hash(key: string): Promise<string> {
    const cached = this.hashCache.get(key)
    if (cached) {
      return cached
    }
    const hash = await hashStringSHA256(key)
    this.hashCache.set(key, hash)
    return hash
  }

  private async getData(keyHash: string): Promise<ApiKeyExtended | null> {
    const data = await this.db.query.apikeys
      .findFirst({
        with: {
          project: {
            columns: {
              workspaceId: true,
              id: true,
              enabled: true,
              slug: true,
              defaultCurrency: true,
              isMain: true,
              isInternal: true,
            },
            with: {
              workspace: {
                columns: {
                  enabled: true,
                  unPriceCustomerId: true,
                  isPersonal: true,
                  isInternal: true,
                  isMain: true,
                },
              },
            },
          },
        },
        columns: {
          id: true,
          projectId: true,
          key: true,
          expiresAt: true,
          revokedAt: true,
          hash: true,
        },
        where: (apikey, { and, eq }) => and(eq(apikey.hash, keyHash)),
      })
      .catch((e) => {
        this.logger.error(`Error fetching apikey from db: ${e.message}`, {
          error: e,
          keyHash,
        })
        return null
      })

    return data ?? null
  }

  private async _getApiKey(
    req: {
      key: string
    },
    opts: {
      skipCache?: boolean
    }
  ): Promise<Result<ApiKeyExtended, SchemaError | FetchError | UnPriceApiKeyError>> {
    const keyHash = await this.hash(req.key)

    if (opts?.skipCache) {
      this.logger.info("force skipping cache", {
        keyHash: keyHash,
      })
    }

    const { val: data, err } = opts?.skipCache
      ? await wrapResult(
          this.getData(keyHash),
          (err) =>
            new FetchError({
              message: "unable to query db",
              retry: false,
              context: {
                error: err.message,
                url: "",
                method: "",
                keyHash,
              },
            })
        )
      : await retry(
          3,
          async () => this.cache.apiKeyByHash.swr(keyHash, (h) => this.getData(h)),
          (attempt, err) => {
            this.logger.warn("Failed to fetch key data, retrying...", {
              hash: keyHash,
              attempt,
              error: err.message,
            })
          }
        )

    if (err) {
      this.logger.error(err.message, {
        hash: keyHash,
        error: err,
      })

      return Err(
        new FetchError({
          message: "unable to fetch required data",
          retry: true,
          cause: err,
        })
      )
    }

    if (!data) {
      return Err(
        new UnPriceApiKeyError({
          code: "NOT_FOUND",
        })
      )
    }

    return Ok(data)
  }

  public async verifyApiKey(
    c: Context,
    req: {
      key: string
    }
  ): Promise<Result<ApiKeyExtended, UnPriceApiKeyError | FetchError | SchemaError>> {
    try {
      const { key } = req

      const result = await this._getApiKey(
        {
          key,
        },
        {
          skipCache: false,
        }
      ).catch(async (err) => {
        this.logger.error("verify error, retrying without cache", {
          error: err.message,
        })
        await this.cache.apiKeyByHash.remove(await this.hash(req.key))
        return await this._getApiKey(
          {
            key,
          },
          {
            skipCache: true,
          }
        )
      })

      if (result.err) {
        // TODO: emit error log
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

      if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
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

      c.set("workspaceId", result.val.project.workspaceId)
      c.set("projectId", result.val.project.id)

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
