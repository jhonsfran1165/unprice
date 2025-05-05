import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { protectedProjectProcedure } from "#trpc"
import { unprice } from "#utils/unprice"

export const getUsage = protectedProjectProcedure
  .input(
    z.object({
      range: z.enum(["60m", "24h", "7d", "30d", "90d"]),
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
    const projectId = opts.ctx.project.id

    const data = await unprice.analytics.getUsage({
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
      usage: data.result?.usage,
    }
  })
