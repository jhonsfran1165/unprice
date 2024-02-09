 
 
 
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initiate Redis instance by connecting to REST URL
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
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
      url:
        process.env.RATELIMIT_UPSTASH_REDIS_REST_URL ??
        process.env.UPSTASH_REDIS_REST_URL ??
        "",
      token:
        process.env.RATELIMIT_UPSTASH_REDIS_REST_TOKEN ??
        process.env.UPSTASH_REDIS_REST_TOKEN ??
        "",
    }),
    limiter: Ratelimit.slidingWindow(requests, seconds),
    analytics: true,
    prefix: "dub",
  })
}
