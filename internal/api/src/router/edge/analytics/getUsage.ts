import { z } from "zod"

import { publicProcedure } from "#trpc"

export const getUsage = publicProcedure
  .input(
    z.object({
      projectId: z.string().optional(),
      customerId: z.string().optional(),
      featureSlug: z.string().optional(),
      entitlementId: z.string().optional(),
      start: z.number().optional(),
      end: z.number().optional(),
    })
  )
  .output(
    z.object({
      data: z.array(
        z.object({
          projectId: z.string(),
          customerId: z.string(),
          featureSlug: z.string(),
          entitlementId: z.string(),
          total_usage: z.number(),
          max_usage: z.number(),
          event_count: z.number(),
          latest_usage: z.number(),
        })
      ),
    })
  )
  .query(async (opts) => {
    const data = await opts.ctx.analytics
      .getFeaturesUsage({
        projectId: opts.input.projectId,
        customerId: opts.input.customerId,
        featureSlug: opts.input.featureSlug,
        entitlementId: opts.input.entitlementId,
        start: opts.input.start,
        end: opts.input.end,
      })
      .catch((err) => {
        console.error(err)
        return {
          data: [],
        }
      })

    return {
      data: data.data,
    }
  })
