import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"

export const getUsage = protectedProjectProcedure
  .input(
    z.object({
      start: z.number(),
      end: z.number(),
    })
  )
  .output(
    z.object({
      usage: z
        .object({
          projectId: z.string(),
          customerId: z.string().optional(),
          entitlementId: z.string().optional(),
          featureSlug: z.string(),
          count: z.number(),
          sum: z.number(),
          max: z.number(),
          last_during_period: z.number(),
        })
        .array(),
    })
  )
  .query(async (opts) => {
    const project = opts.ctx.project

    const data = await opts.ctx.analytics
      .getFeaturesUsagePeriod({
        projectId: project.id,
        start: opts.input.start,
        end: opts.input.end,
      })
      .catch((err) => {
        opts.ctx.logger.error(
          JSON.stringify({
            message: "Error getting usage",
            error: err.message,
          })
        )

        return {
          data: [],
        }
      })

    return {
      usage: data.data,
    }
  })
