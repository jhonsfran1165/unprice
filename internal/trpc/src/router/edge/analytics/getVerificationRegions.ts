import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { TIMEOUTS, withTimeout } from "#utils/timeout"

export const getVerificationRegions = protectedProjectProcedure
  .input(z.custom<Omit<Parameters<Analytics["getFeaturesVerificationRegions"]>[0], "projectId">>())
  .output(
    z.object({
      verifications:
        z.custom<Awaited<ReturnType<Analytics["getFeaturesVerificationRegions"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const input = opts.input

    try {
      const result = await withTimeout(
        opts.ctx.analytics.getFeaturesVerificationRegions({
          projectId,
          region: input.region,
          intervalDays: input.intervalDays,
        }),
        TIMEOUTS.ANALYTICS,
        "getFeaturesVerificationRegions analytics request timeout"
      )

      return { verifications: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      opts.ctx.logger.error("getFeaturesVerificationRegions failed", {
        error: errorMessage,
        projectId,
        isTimeout: errorMessage.includes("timeout"),
      })

      // Return empty data as fallback
      return { verifications: [] }
    }
  })
