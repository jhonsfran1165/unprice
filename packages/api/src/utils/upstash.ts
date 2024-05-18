import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

import type { SubscriptionExtended } from "@builderai/db/validators"

import { env } from "../env.mjs"

// Initiate Redis instance by connecting to REST URL
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

// Create a new ratelimiter, that allows 10 requests per 10 seconds by default
export const ratelimit = (
  requests = 10,
  seconds:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = "10 s"
) => {
  return new Ratelimit({
    redis: new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(requests, seconds),
    analytics: true,
    prefix: "builderai",
  })
}

export const getCustomerHash = (projectId: string, customerId: string) => {
  return `app:${projectId}:customer:${customerId}`
}

export const getActiveSubscriptions = async (id: string) => {
  const cachedData = await redis.hgetall<{
    activeSubscriptions: SubscriptionExtended[]
  }>(id)

  return cachedData?.activeSubscriptions ?? []
}

export const setActiveSubscriptions = async (
  id: string,
  activeSubscriptions: SubscriptionExtended[]
) => {
  return redis.hset(id, { activeSubscriptions })
}

export const appendActiveSubscription = async (
  id: string,
  activeSubscription: SubscriptionExtended
) => {
  const activeSubscriptions = await getActiveSubscriptions(id)
  activeSubscriptions.push(activeSubscription)
  return setActiveSubscriptions(id, activeSubscriptions)
}
