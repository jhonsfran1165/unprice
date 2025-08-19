import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { TIMEOUTS, withTimeout } from "#utils/timeout"

export const getFeatureHeatmap = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeatureHeatmap"]>[0]>())
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getFeatureHeatmap"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays, start, end } = opts.input

    try {
      const result = await withTimeout(
        opts.ctx.analytics.getFeatureHeatmap({
          projectId: opts.ctx.project.id,
          intervalDays,
          start,
          end,
        }),
        TIMEOUTS.ANALYTICS,
        "getFeatureHeatmap analytics request timeout"
      )

      return { data: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      opts.ctx.logger.error("getFeatureHeatmap failed", {
        error: errorMessage,
        projectId: opts.ctx.project.id,
        intervalDays,
        isTimeout: errorMessage.includes("timeout"),
      })

      // Return empty data as fallback
      return { data: [] }
    }
  })
