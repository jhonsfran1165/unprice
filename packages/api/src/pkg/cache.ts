import { Redis } from "@upstash/redis"

import type { SubscriptionExtended } from "@builderai/db/validators"

import { env } from "../env.mjs"

declare class NoopCache extends Redis {
  constructor()
}

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : new NoopCache()

export interface CacheInterface {
  getCustomerActiveSubs: (
    customerHash: string
  ) => Promise<SubscriptionExtended[] | null>

  setCustomerActiveSubs: (
    customerHash: string,
    activeSubs: SubscriptionExtended[]
  ) => Promise<number>
}

export class UnpriceCache implements CacheInterface {
  public readonly client: Redis | NoopCache

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

  async getCustomerActiveSubs(customerHash: string) {
    return this.client.hget<SubscriptionExtended[]>(
      customerHash,
      "activeSubscriptions"
    )
  }

  async setCustomerActiveSubs(
    customerHash: string,
    activeSubs: SubscriptionExtended[]
  ) {
    return this.client.hset<SubscriptionExtended[]>(customerHash, {
      activeSubscriptions: activeSubs,
    })
  }
}

export const getCustomerHash = (projectId: string, customerId: string) => {
  return `app:${projectId}:customer:${customerId}`
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
