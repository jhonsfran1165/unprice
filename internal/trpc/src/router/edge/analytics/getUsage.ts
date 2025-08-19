import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { TIMEOUTS, withTimeout } from "#utils/timeout"

export const getUsage = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesUsagePeriod"]>[0]>())
  .output(
    z.object({
      usage: z.custom<Awaited<ReturnType<Analytics["getFeaturesUsagePeriod"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const { intervalDays } = opts.input

    try {
      const result = await withTimeout(
        opts.ctx.analytics.getFeaturesUsagePeriod({
          projectId,
          intervalDays,
        }),
        TIMEOUTS.ANALYTICS,
        "getFeaturesUsagePeriod analytics request timeout"
      )

      return { usage: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      opts.ctx.logger.error("getFeaturesUsagePeriod failed", {
        error: errorMessage,
        projectId,
        isTimeout: errorMessage.includes("timeout"),
      })

      // Return empty data as fallback
      return { usage: [] }
    }
  })
