import { Redis } from "@upstash/redis"

import type {
  SubscriptionExtended,
  SubscriptionItem,
  SubscriptionItemCache,
  SubscriptionItemExtended,
} from "@builderai/db/validators"
import type { Result } from "@builderai/error"
import { Err, FetchError, Ok } from "@builderai/error"
import { env } from "../../env.mjs"
import { formatFeatureCache } from "../../utils/shared"

export const LATENCY_LOGGING = env.NODE_ENV === "development"
export const ENABLE_AUTO_PIPELINING = true

class NoopCache extends Redis {
  constructor() {
    super({ token: "", url: "" })
  }
}

// Cache interface so you can swap out the cache implementation
export interface CacheInterface {
  getCustomerEntitlements: (customerId: string) => Promise<Result<string[], FetchError>>

  setCustomerEntitlements: (customerId: string, activeSubs: string[]) => Promise<Result<number>>

  getCustomerActiveSubs: (customerId: string) => Promise<Result<SubscriptionExtended[], FetchError>>

  setCustomerActiveSubs: (
    customerId: string,
    activeSubs: SubscriptionExtended[]
  ) => Promise<Result<number>>
}

const namespaces = {
  customer: "customer",
  subscription: "subscription",
} as const

export class UnpriceCache implements CacheInterface {
  private readonly client: Redis | NoopCache
  private readonly namespaces = namespaces
  // this is a noop cache that fallback all calls to empty data
  // when that happens, we call the database directly
  private readonly noop: boolean = false
  // TODO: implement cache TTL
  // private readonly defaultTTL = 60 * 60 * 24 * 7 // 1 week
  // private readonly defaultTTLKey = "ttl"

  constructor(opts?: { token?: string; url?: string }) {
    if (!opts?.url || !opts?.token) {
      this.client = new NoopCache()
      this.noop = true
    } else {
      // TODO: extract this out of the constructor so we can reuse it from RSC
      this.client = new Redis({
        token: opts.token,
        url: opts.url,
        // enable auto pipelining to improve performance
        latencyLogging: LATENCY_LOGGING,
        enableAutoPipelining: ENABLE_AUTO_PIPELINING,
      })
    }
  }

  public setIdempotentUsage(hash: string, result: boolean) {
    // 1 minutes cache TTL
    return this.client.set(`idempotent:${hash}`, result, { ex: 60 * 1 })
  }

  public async getIdempotentUsage(hash: string) {
    return await this.client.get<boolean>(`idempotent:${hash}`)
  }

  private hash(namespace: keyof typeof namespaces, ...keys: string[]) {
    return `app:${this.namespaces[namespace]}:${keys.join(":")}`
  }

  public async getCustomerEntitlements(customerId: string): Promise<Result<string[], FetchError>> {
    try {
      const hash = this.hash("customer", customerId)

      if (this.noop) {
        return Ok([])
      }

      // TODO: can we use a bitmap for this? we can use the code of the feature
      const activeSubs = await this.client.hget<string[]>(hash, "entitlements")

      return Ok(activeSubs ?? [])
    } catch (error) {
      const e = error as Error
      return Err(
        new FetchError({
          message: e.message,
          retry: false,
        })
      )
    }
  }

  public async setCustomerEntitlements(
    customerId: string,
    entitlements: string[]
  ): Promise<Result<number, FetchError>> {
    try {
      const hash = this.hash("customer", customerId)

      if (this.noop) {
        return Ok(1)
      }

      const success = await this.client.hset(hash, {
        entitlements: entitlements,
      })

      return Ok(success)
    } catch (error) {
      const e = error as Error
      return Err(
        new FetchError({
          message: e.message,
          retry: false,
        })
      )
    }
  }

  public async getCustomerActiveSubs(
    customerId: string
  ): Promise<Result<SubscriptionExtended[], FetchError>> {
    try {
      const hash = this.hash("customer", customerId)

      if (this.noop) {
        return Ok([])
      }

      const activeSubs = await this.client.hget<SubscriptionExtended[]>(hash, "activeSubscriptions")

      return Ok(activeSubs ?? [])
    } catch (error) {
      const e = error as Error
      return Err(
        new FetchError({
          message: e.message,
          retry: false,
        })
      )
    }
  }

  public async setCustomerActiveSubs(
    customerId: string,
    activeSubs: SubscriptionExtended[]
  ): Promise<Result<number, FetchError>> {
    try {
      const hash = this.hash("customer", customerId)

      if (this.noop) {
        return Ok(1)
      }

      const success = await this.client.hset(hash, {
        activeSubscriptions: activeSubs,
      })

      return Ok(success)
    } catch (error) {
      const e = error as Error
      return Err(
        new FetchError({
          message: e.message,
          retry: false,
        })
      )
    }
  }

  public async getCustomerFeature(
    customerId: string,
    featureSlug: string
  ): Promise<Result<SubscriptionItemCache | null, FetchError>> {
    try {
      if (this.noop) {
        return Ok(null)
      }

      const hash = this.hash("customer", customerId, "feature", featureSlug)

      const feature = await this.client.hgetall<SubscriptionItemCache>(hash)

      return Ok(feature ?? null)
    } catch (error) {
      const e = error as Error
      return Err(
        new FetchError({
          message: e.message,
          retry: false,
        })
      )
    }
  }

  public async getCustomerFeatures(
    customerId: string
  ): Promise<Result<Map<string, SubscriptionItemCache> | null, FetchError>> {
    try {
      if (this.noop) {
        return Ok(null)
      }

      const hash = this.hash("customer", customerId, "feature", "*")
      const keys = await this.client.scan(0, { match: hash })

      const features = await Promise.all(
        keys[1].map(async (key) => {
          return this.client.hgetall<SubscriptionItemCache>(key) ?? {}
        })
      )

      // convert to a map without null values
      const featuresMap = new Map<string, SubscriptionItemCache>()
      features.forEach((f) => {
        if (f?.featureSlug) {
          featuresMap.set(f.featureSlug, f)
        }
      })

      return Ok(featuresMap)
    } catch (error) {
      const e = error as Error
      return Err(
        new FetchError({
          message: e.message,
          retry: false,
        })
      )
    }
  }

  public async setCustomerFeatures(
    customerId: string,
    features: SubscriptionItemExtended[]
  ): Promise<Result<number, FetchError>> {
    try {
      if (this.noop) {
        return Ok(1)
      }

      await Promise.all(
        features.map(async (feature) => {
          const hash = this.hash("customer", customerId, "feature", feature.featureSlug)
          return this.client.hset(hash, formatFeatureCache(feature))
        })
      )

      return Ok(features.length)
    } catch (error) {
      const e = error as Error
      return Err(
        new FetchError({
          message: e.message,
          retry: false,
        })
      )
    }
  }

  public async setCustomerFeatureUsage(
    customerId: string,
    featureSlug: string,
    usage: number
  ): Promise<Result<number, FetchError>> {
    try {
      if (this.noop) {
        return Ok(0)
      }

      const hash = this.hash("customer", customerId, "feature", featureSlug)

      const feature = await this.client.hincrby(hash, "usage", usage)

      return Ok(feature)
    } catch (error) {
      const e = error as Error
      return Err(
        new FetchError({
          message: e.message,
          retry: false,
        })
      )
    }
  }
}

// Create a new ratelimiter, that allows 10 requests per 10 seconds by default
// export const ratelimit = (
//   requests = 10,
//   seconds:
//     | `${number} ms`
//     | `${number} s`
//     | `${number} m`
//     | `${number} h`
//     | `${number} d` = "10 s"
// ) => {
//   return new Ratelimit({
//     redis: new Redis({
//       url: env.UPSTASH_REDIS_REST_URL,
//       token: env.UPSTASH_REDIS_REST_TOKEN,
//     }),
//     limiter: Ratelimit.slidingWindow(requests, seconds),
//     analytics: true,
//     prefix: "builderai",
//   })
// }
