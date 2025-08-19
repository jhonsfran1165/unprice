import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { TIMEOUTS, withTimeout } from "#utils/timeout"

export const getVerifications = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesVerifications"]>[0]>())
  .output(
    z.object({
      verifications: z.custom<Awaited<ReturnType<Analytics["getFeaturesVerifications"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const input = opts.input

    try {
      const result = await withTimeout(
        opts.ctx.analytics.getFeaturesVerifications({
          projectId,
          intervalDays: input.intervalDays,
        }),
        TIMEOUTS.ANALYTICS,
        "getFeaturesVerifications analytics request timeout"
      )

      return { verifications: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      opts.ctx.logger.error("getFeaturesVerifications failed", {
        error: errorMessage,
        projectId,
        intervalDays: input.intervalDays,
        isTimeout: errorMessage.includes("timeout"),
      })

      // Return empty data as fallback
      return { verifications: [] }
    }
  })
