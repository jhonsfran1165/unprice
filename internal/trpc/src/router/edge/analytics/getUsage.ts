import type { Analytics, Usage } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getUsage = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesUsagePeriod"]>[0]>())
  .output(
    z.object({
      usage: z.custom<Usage>(),
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const { intervalDays } = opts.input

    const cacheKey = `${projectId}:${intervalDays}`
    const result = await opts.ctx.cache.getUsage.swr(cacheKey, async () => {
      const result = await opts.ctx.analytics
        .getFeaturesUsagePeriod({
          projectId,
          intervalDays,
        })
        .then((res) => res.data)

      return result
    })

    if (result.err) {
      return { usage: [], error: result.err.message }
    }

    const usage = result.val ?? []

    return { usage }
  })
