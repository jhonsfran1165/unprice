import type { Analytics, VerificationRegions } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getVerificationRegions = protectedProjectProcedure
  .input(z.custom<Omit<Parameters<Analytics["getFeaturesVerificationRegions"]>[0], "projectId">>())
  .output(
    z.object({
      verifications: z.custom<VerificationRegions>(),
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const timezone = opts.ctx.project.timezone
    const input = opts.input

    const cacheKey = `${projectId}:${input.region}:${timezone}:${input.intervalDays}`

    const result = await opts.ctx.cache.getVerificationRegions.swr(cacheKey, async () => {
      const result = await opts.ctx.analytics
        .getFeaturesVerificationRegions({
          projectId,
          timezone,
          region: input.region,
          intervalDays: input.intervalDays,
        })
        .then((res) => res.data)

      return result
    })

    if (result.err) {
      opts.ctx.logger.error(result.err.message, {
        projectId,
        region: input.region,
        intervalDays: input.intervalDays,
      })

      return { verifications: [], error: result.err.message }
    }

    const verifications = result.val ?? []

    return { verifications }
  })
