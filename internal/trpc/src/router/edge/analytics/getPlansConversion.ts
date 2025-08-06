import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getPlansConversion = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getPlansConversion"]>[0]>())
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getPlansConversion"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays } = opts.input
    const projectId = opts.ctx.project.id

    const data = await opts.ctx.analytics
      .getPlansConversion({
        projectId,
        intervalDays,
      })
      .catch((err) => {
        opts.ctx.logger.error("Failed to get plans conversion", {
          error: err,
        })

        return { data: [] }
      })

    return { data: data.data }
  })
