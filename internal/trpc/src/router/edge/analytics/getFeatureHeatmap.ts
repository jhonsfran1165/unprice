import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getFeatureHeatmap = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeatureHeatmap"]>[0]>())
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getFeatureHeatmap"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays, start, end } = opts.input

    const data = await opts.ctx.analytics
      .getFeatureHeatmap({
        projectId: opts.ctx.project.id,
        intervalDays,
        start,
        end,
      })
      .catch((err) => {
        opts.ctx.logger.error("Failed to get feature heatmap", {
          error: err,
        })

        return { data: [] }
      })

    return { data: data.data }
  })
