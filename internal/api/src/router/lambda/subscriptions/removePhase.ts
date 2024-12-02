import { TRPCError } from "@trpc/server"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const removePhase = protectedProjectProcedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ result: z.boolean() }))
  .mutation(async (opts) => {
    const projectId = opts.ctx.project.id

    const subscriptionService = new SubscriptionService({
      db: opts.ctx.db,
      cache: opts.ctx.cache,
      metrics: opts.ctx.metrics,
      logger: opts.ctx.logger,
      waitUntil: opts.ctx.waitUntil,
      analytics: opts.ctx.analytics,
    })

    const { err, val } = await subscriptionService.removePhase({
      phaseId: opts.input.id,
      projectId,
      now: Date.now(),
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    return {
      result: val,
    }
  })
