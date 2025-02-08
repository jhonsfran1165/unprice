import { z } from "zod"

import { protectedApiOrActiveProjectProcedure } from "#trpc"

export const getVerifications = protectedApiOrActiveProjectProcedure
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
      verifications: z
        .object({
          projectId: z.string(),
          customerId: z.string(),
          entitlementId: z.string(),
          featureSlug: z.string(),
          count: z.number(),
          p95_latency: z.number(),
          max_latency: z.number(),
          latest_latency: z.number(),
        })
        .array(),
    })
  )
  .query(async (opts) => {
    const data = await opts.ctx.analytics
      .getFeaturesVerifications({
        projectId: opts.input.projectId,
        customerId: opts.input.customerId,
        featureSlug: opts.input.featureSlug,
        entitlementId: opts.input.entitlementId,
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
      verifications: data.data,
    }
  })
