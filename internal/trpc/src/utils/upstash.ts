import { Redis } from "@upstash/redis"

import { env } from "#env"

const LATENCY_LOGGING = env.NODE_ENV === "development"
const ENABLE_AUTO_PIPELINING = true

// old stuff https://github.com/jhonsfran1165/unprice/blob/489ffc7a61d29e50a902c74ac3fc06ca611daf4b/internal/api/src/services/cache/upstash.ts
export const redis = new Redis({
  token: env.UPSTASH_REDIS_REST_TOKEN,
  url: env.UPSTASH_REDIS_REST_URL,
  // enable auto pipelining to improve performance
  latencyLogging: LATENCY_LOGGING,
  enableAutoPipelining: ENABLE_AUTO_PIPELINING,
})
