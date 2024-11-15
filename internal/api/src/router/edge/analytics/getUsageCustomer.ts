import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"
import { getEntitlements } from "../../../utils/shared"

export const getUsageCustomer = protectedApiOrActiveProjectProcedure
  .input(
    z.object({
      start: z.number(),
      end: z.number(),
      customerId: z.string(),
    })
  )
  .output(
    z.object({
      usage: z.array(
        z.object({
          featureSlug: z.string(),
          usage: z.number(),
          limit: z.number().nullable(),
          units: z.number().nullable(),
          featureId: z.string(),
          featureType: z.string(),
        })
      ),
    })
  )
  .query(async (opts) => {
    const project = opts.ctx.project
    const { start, end, customerId } = opts.input

    const res = await getEntitlements({
      customerId,
      projectId: project.id,
      ctx: opts.ctx,
    })

    const usage = await Promise.all(
      res.map(async (r) => {
        return opts.ctx.analytics
          .getTotalUsagePerFeature({
            featureSlug: r.featureSlug,
            customerId,
            projectId: project.id,
            start,
            end,
          })
          .then((data) => {
            const usageFeature = data.data[0]
            return {
              ...r,
              usage: usageFeature ? usageFeature[r.aggregationMethod] || 0 : 0,
            }
          })
      })
    ).catch((err) => {
      opts.ctx.logger.error("Error getting usage", {
        error: JSON.stringify(err),
      })

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get usage: ${err.message}`,
      })
    })

    return {
      usage: usage,
    }
  })
