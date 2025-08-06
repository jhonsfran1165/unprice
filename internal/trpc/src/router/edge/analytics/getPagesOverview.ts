import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getPagesOverview = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getPagesOverview"]>[0]>())
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getPagesOverview"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays, pageId } = opts.input

    const data = await opts.ctx.analytics
      .getPagesOverview({
        intervalDays,
        pageId,
      })
      .catch((err) => {
        opts.ctx.logger.error("Failed to get pages overview", {
          error: err,
        })

        return { data: [] }
      })

    return { data: data.data }
  })
