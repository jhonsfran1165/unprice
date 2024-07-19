import { TRPCError } from "@trpc/server"
import { type DurationRateLimit, ratelimit } from "./upstash"

export const rateLimitGuard = async ({
  identifier,
  requests = 10,
  duration = "10 s",
}: {
  identifier: string
  requests?: number
  duration?: DurationRateLimit
}) => {
  const limiter = ratelimit(requests, duration)
  const { success } = await limiter.limit(identifier)

  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Don't DDoS me pls 🥺",
    })
  }

  return success
}
