import type { Analytics, PlansConversion } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getPlansConversion = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getPlansConversion"]>[0]>())
  .output(
    z.object({
      data: z.custom<PlansConversion>(),
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const { intervalDays } = opts.input
    const projectId = opts.ctx.project.id

    const cacheKey = `${projectId}:${intervalDays}`
    const result = await opts.ctx.cache.getPlansConversion.swr(cacheKey, async () => {
      const result = await opts.ctx.analytics
        .getPlansConversion({
          projectId,
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
