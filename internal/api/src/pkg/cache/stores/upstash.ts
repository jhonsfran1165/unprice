import { CacheError } from "@unkey/cache"
import type { Entry, Store } from "@unkey/cache/stores"

import { Err, Ok, type Result } from "@unkey/error"
import { Redis } from "@upstash/redis"
import superjson from "superjson"
import { env } from "../../../env.mjs"

export const LATENCY_LOGGING = env.NODE_ENV === "development"
export const ENABLE_AUTO_PIPELINING = true

export type UpstashCacheConfig = {
  url: string
  /**
   * This token must have at least
   */
  token: string
}

export class UpstashStore<TNamespace extends string, TValue> implements Store<TNamespace, TValue> {
  private readonly config: UpstashCacheConfig
  public readonly name = "Upstash"
  private readonly client: Redis

  constructor(config: UpstashCacheConfig) {
    this.config = config

    this.client = new Redis({
      token: config.token,
      url: config.url,
      // enable auto pipelining to improve performance
      latencyLogging: LATENCY_LOGGING,
      enableAutoPipelining: ENABLE_AUTO_PIPELINING,
    })
  }

  public async get(
    namespace: TNamespace,
    key: string
  ): Promise<Result<Entry<TValue> | undefined, CacheError>> {
    let res: string | null
    try {
      res = await this.client.get<string>(`${String(namespace)}/${key}`)
    } catch (err) {
      return Err(
        new CacheError({
          tier: this.name,
          key,
          message: (err as Error).message,
        })
      )
    }

    if (!res) {
      return Ok(undefined)
    }

    try {
      const entry = superjson.parse(JSON.stringify(res)) as Entry<TValue>
      return Ok(entry)
    } catch (err) {
      return Err(
        new CacheError({
          tier: this.name,
          key,
          message: (err as Error).message,
        })
      )
    }
  }

  public async set(
    namespace: TNamespace,
    key: string,
    entry: Entry<TValue>
  ): Promise<Result<void, CacheError>> {
    try {
      await this.client.set(`${String(namespace)}/${key}`, superjson.stringify(entry), {
        exat: Math.floor(entry.staleUntil / 1000),
      })
      return Ok()
    } catch (err) {
      return Err(
        new CacheError({
          tier: this.name,
          key,
          message: (err as Error).message,
        })
      )
    }
  }

  public async remove(namespace: TNamespace, key: string): Promise<Result<void, CacheError>> {
    try {
      await this.client.del(`${String(namespace)}/${key}`)
      return Ok()
    } catch (err) {
      return Err(
        new CacheError({
          tier: this.name,
          key,
          message: (err as Error).message,
        })
      )
    }
  }
}
