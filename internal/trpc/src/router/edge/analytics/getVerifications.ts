import type { Analytics, Verifications } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getVerifications = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesVerifications"]>[0]>())
  .output(
    z.object({
      verifications: z.custom<Verifications>(),
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const input = opts.input

    const cacheKey = `${projectId}:${input.intervalDays}`
    const result = await opts.ctx.cache.getVerifications.swr(cacheKey, async () => {
      const result = opts.ctx.analytics
        .getFeaturesVerifications({
          projectId,
          intervalDays: input.intervalDays,
        })
        .then((res) => res.data)

      return result
    })

    if (result.err) {
      return { verifications: [], error: result.err.message }
    }

    const verifications = result.val ?? []

    return { verifications }
  })
