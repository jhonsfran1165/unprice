import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"

export const getVerifications = protectedProjectProcedure
  .input(
    z.object({
      start: z.number().optional(),
      end: z.number().optional(),
    })
  )
  .output(
    z.object({
      verifications: z
        .object({
          projectId: z.string(),
          customerId: z.string().optional(),
          entitlementId: z.string().optional(),
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
    const project = opts.ctx.project

    const data = await opts.ctx.analytics
      .getFeaturesVerifications({
        projectId: project.id,
        start: opts.input.start,
        end: opts.input.end,
      })
      .catch((err) => {
        opts.ctx.logger.error(
          JSON.stringify({
            message: "Error getting verifications",
            error: err.message,
          })
        )

        return {
          data: [],
        }
      })

    return {
      verifications: data.data,
    }
  })
