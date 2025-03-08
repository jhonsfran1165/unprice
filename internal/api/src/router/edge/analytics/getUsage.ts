import { z } from "zod"

import { protectedApiOrActiveProjectProcedure } from "#trpc"

export const getUsage = protectedApiOrActiveProjectProcedure
  .input(
    z.object({
      start: z.number().optional(),
      end: z.number().optional(),
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
      .getFeaturesUsage({
        projectId: project.id,
        start: opts.input.start,
        end: opts.input.end,
      })
      .catch((err) => {
        opts.ctx.logger.error(err)

        return {
          data: [],
        }
      })

    return {
      usage: data.data,
    }
  })
