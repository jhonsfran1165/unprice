import { Redis } from "@upstash/redis"

import type { SubscriptionExtended } from "@builderai/db/validators"
import type { Result } from "@builderai/error"
import { Err, FetchError, Ok } from "@builderai/error"

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
      this.client = new Redis({
        token: opts.token,
        url: opts.url,
      })
    }
  }

  private getCustomerHash(key: keyof typeof namespaces, id: string) {
    return `app:${this.namespaces[key]}:${id}`
  }

  public async getCustomerEntitlements(customerId: string): Promise<Result<string[], FetchError>> {
    try {
      const hash = this.getCustomerHash("customer", customerId)

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
      const hash = this.getCustomerHash("customer", customerId)

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
      const hash = this.getCustomerHash("customer", customerId)

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
      const hash = this.getCustomerHash("customer", customerId)

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
