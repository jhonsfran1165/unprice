import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getUsage = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesUsagePeriod"]>[0]>())
  .output(
    z.object({
      usage: z.custom<Awaited<ReturnType<Analytics["getFeaturesUsagePeriod"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const input = opts.input

    const data = await opts.ctx.analytics
      .getFeaturesUsagePeriod({
        projectId,
        start: input.start,
        end: input.end,
      })
      .catch((err) => {
        opts.ctx.logger.error(`Failed to get usage for project ${projectId}`, {
          error: err.message,
        })
        return {
          data: [],
        }
      })

    return {
      usage: data.data,
    }
  })
