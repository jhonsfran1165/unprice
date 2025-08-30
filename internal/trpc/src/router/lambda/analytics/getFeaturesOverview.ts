import type { Analytics } from "@unprice/analytics"
import type { FeaturesOverview } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getFeaturesOverview = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesOverview"]>[0]>())
  .output(
    z.object({
      data: z.custom<FeaturesOverview>(),
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const { intervalDays } = opts.input
    const projectId = opts.ctx.project.id
    const timezone = opts.ctx.project.timezone

    const cacheKey = `${projectId}:${timezone}:${intervalDays}`
    const result = await opts.ctx.cache.getFeaturesOverview.swr(cacheKey, async () => {
      const result = await opts.ctx.analytics
        .getFeaturesOverview({
          projectId,
          intervalDays,
          timezone,
        })
        .then((res) => res.data)

      return result
    })

    if (result.err) {
      opts.ctx.logger.error(result.err.message, {
        projectId,
        intervalDays,
      })

      return { data: [], error: result.err.message }
    }

    const data = result.val ?? []

    return { data }
  })
