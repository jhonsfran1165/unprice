import {
  analyticsIntervalSchema,
  getAnalyticsVerificationsResponseSchema,
  prepareInterval,
} from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getVerifications = protectedProjectProcedure
  .input(
    z.object({
      range: analyticsIntervalSchema,
    })
  )
  .output(
    z.object({
      verifications: getAnalyticsVerificationsResponseSchema.array(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const interval = prepareInterval(opts.input.range)

    const data = await opts.ctx.analytics
      .getFeaturesVerifications({
        projectId,
        start: interval.start,
        end: interval.end,
      })
      .catch((err) => {
        opts.ctx.logger.error(`Failed to get verifications for project ${projectId}`, {
          error: err,
        })
        return {
          data: [],
        }
      })

    return {
      verifications: data.data,
    }
  })
