import { TRPCError } from "@trpc/server"
import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getFeatureHeatmap = protectedProjectProcedure
  .input(
    z.object({
      intervalDays: z.number().min(1).max(90),
    })
  )
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getFeatureHeatmap"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays } = opts.input

    const data = await opts.ctx.analytics
      .getFeatureHeatmap({
        projectId: opts.ctx.project.id,
        intervalDays,
      })
      .catch((err) => {
        opts.ctx.logger.error("Failed to get feature heatmap", {
          error: err,
        })

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get feature heatmap: ${err.message}`,
        })
      })

    return { data: data.data }
  })
