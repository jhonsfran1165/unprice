import { Redis } from "@upstash/redis"

import { env } from "../../env"

const LATENCY_LOGGING = env.NODE_ENV === "development"

// singleton pattern
let redisInstance: Redis | null = null

export const createRedis = ({
  token,
  url,
  latencyLogging,
}: {
  token: string
  url: string
  latencyLogging?: boolean
}) => {
  if (redisInstance) {
    return redisInstance
  }

  const redis = new Redis({
    token,
    url,
    // enable auto pipelining to improve performance
    latencyLogging: latencyLogging ?? LATENCY_LOGGING,
    enableAutoPipelining: true,
  })

  redisInstance = redis

  return redis
}

// old stuff https://github.com/jhonsfran1165/unprice/blob/489ffc7a61d29e50a902c74ac3fc06ca611daf4b/internal/api/src/services/cache/upstash.ts
