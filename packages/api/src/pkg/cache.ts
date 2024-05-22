import { Redis } from "@upstash/redis"

import type { SubscriptionExtended } from "@builderai/db/validators"
import type { Result } from "@builderai/error"
import { Err, FetchError, Ok } from "@builderai/error"

import { env } from "../env.mjs"

declare class NoopCache extends Redis {
  constructor()
}

// TODO: is it a good idea to instance this here? maybe inside the class?
const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : new NoopCache()

// Cache interface so you can swap out the cache implementation
export interface CacheInterface {
  getCustomerActiveSubs: (
    customerId: string
  ) => Promise<Result<SubscriptionExtended[], FetchError>>

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

  constructor(opts?: { token: string; url: string }) {
    if (!opts) {
      this.client = redis
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

  public async getCustomerActiveSubs(
    customerId: string
  ): Promise<Result<SubscriptionExtended[], FetchError>> {
    try {
      const hash = this.getCustomerHash("customer", customerId)
      const activeSubs = await this.client.hget<SubscriptionExtended[]>(
        hash,
        "activeSubscriptions"
      )

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
