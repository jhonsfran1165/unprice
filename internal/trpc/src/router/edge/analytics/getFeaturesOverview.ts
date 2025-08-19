import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { TIMEOUTS, withTimeout } from "#utils/timeout"

export const getFeaturesOverview = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesOverview"]>[0]>())
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getFeaturesOverview"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays } = opts.input
    const projectId = opts.ctx.project.id

    try {
      const result = await withTimeout(
        opts.ctx.analytics.getFeaturesOverview({
          projectId,
          intervalDays,
        }),
        TIMEOUTS.ANALYTICS,
        "getFeaturesOverview analytics request timeout"
      )

      return { data: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      opts.ctx.logger.error("getFeaturesOverview failed", {
        error: errorMessage,
        projectId,
        intervalDays,
        isTimeout: errorMessage.includes("timeout"),
      })

      // Return empty data as fallback
      return { data: [] }
    }
  })
