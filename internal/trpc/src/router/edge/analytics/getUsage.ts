import { type Analytics, analyticsIntervalSchema, prepareInterval } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getUsage = protectedProjectProcedure
  .input(
    z.object({
      range: analyticsIntervalSchema,
    })
  )
  .output(
    z.object({
      usage: z.custom<Awaited<ReturnType<Analytics["getFeaturesUsagePeriod"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const interval = prepareInterval(opts.input.range)

    const data = await opts.ctx.analytics
      .getFeaturesUsagePeriod({
        projectId,
        start: interval.start,
        end: interval.end,
      })
      .catch((err) => {
        opts.ctx.logger.error(`Failed to get usage for project ${projectId}`, {
          error: err,
        })
        return {
          data: [],
        }
      })

    return {
      usage: data.data,
    }
  })
