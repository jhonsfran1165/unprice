import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

import { env } from "#/env.mjs"

const LATENCY_LOGGING = env.NODE_ENV === "development"
const ENABLE_AUTO_PIPELINING = true

export const redis = new Redis({
  token: env.UPSTASH_REDIS_REST_TOKEN,
  url: env.UPSTASH_REDIS_REST_URL,
  // enable auto pipelining to improve performance
  latencyLogging: LATENCY_LOGGING,
  enableAutoPipelining: ENABLE_AUTO_PIPELINING,
})

type Unit = "ms" | "s" | "m" | "h" | "d"
export type DurationRateLimit = `${number} ${Unit}` | `${number}${Unit}`

// Create a new ratelimiter, that allows 10 requests per 10 seconds by default
export const ratelimit = (requests = 10, duration: DurationRateLimit = "10 s") => {
  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(requests, duration),
    analytics: true,
    prefix: "unprice",
  })
}

// rate limit with 10 request per 10 seconds
export const RATE_LIMIT_WINDOW = {
  max: 10,
  windowMs: 10000,
  prefix: "unprice",
  analytics: true,
}
