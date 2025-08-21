import type { Analytics, FeatureHeatmap } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getFeatureHeatmap = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeatureHeatmap"]>[0]>())
  .output(
    z.object({
      data: z.custom<FeatureHeatmap>(),
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const { intervalDays } = opts.input
    const projectId = opts.ctx.project.id

    const cacheKey = `${projectId}:${intervalDays}`
    const result = await opts.ctx.cache.getFeatureHeatmap.swr(cacheKey, async () => {
      const result = await opts.ctx.analytics
        .getFeatureHeatmap({
          projectId: opts.ctx.project.id,
          intervalDays,
        })
        .then((res) => res.data)

      return result
    })

    if (result.err) {
      return { data: [], error: result.err.message }
    }

    const data = result.val ?? []

    return { data }
  })
