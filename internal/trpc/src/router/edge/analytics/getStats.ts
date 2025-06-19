import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { analyticsIntervalSchema, getAnalyticsVerificationsResponseSchema } from "@unprice/tinybird"
import { protectedProjectProcedure } from "#trpc"
import { unprice } from "#utils/unprice"

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

    const data = await unprice.analytics.getVerifications({
      projectId,
      range: opts.input.range,
    })

    if (data.error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: data.error.message,
      })
    }

    return {
      verifications: data.result?.verifications,
    }
  })
