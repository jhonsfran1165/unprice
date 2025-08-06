import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getFeaturesOverview = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesOverview"]>[0]>())
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getFeaturesOverview"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays } = opts.input
    const projectId = opts.ctx.project.id

    const data = await opts.ctx.analytics
      .getFeaturesOverview({
        projectId,
        intervalDays,
      })
      .catch((err) => {
        opts.ctx.logger.error("Failed to get features overview", {
          error: err,
        })

        return { data: [] }
      })

    return { data: data.data }
  })
