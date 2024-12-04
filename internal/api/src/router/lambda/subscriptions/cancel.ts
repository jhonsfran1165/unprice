import { TRPCError } from "@trpc/server"
import { phaseStatusSchema, subscriptionSelectSchema } from "@unprice/db/validators"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const cancel = protectedProjectProcedure
  .input(
    subscriptionSelectSchema.pick({ id: true, metadata: true }).extend({
      endAt: z.number().optional(),
    })
  )
  .output(z.object({ status: phaseStatusSchema, message: z.string() }))
  .mutation(async (opts) => {
    // only owner and admin can cancel a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const { id: subscriptionId, endAt, metadata } = opts.input
    const projectId = opts.ctx.project.id

    const subscriptionService = new SubscriptionService({
      db: opts.ctx.db,
      cache: opts.ctx.cache,
      metrics: opts.ctx.metrics,
      logger: opts.ctx.logger,
      waitUntil: opts.ctx.waitUntil,
      analytics: opts.ctx.analytics,
    })

    // init phase machine
    const initPhaseMachineResult = await subscriptionService.initPhaseMachines({
      subscriptionId: subscriptionId,
      projectId,
    })

    if (initPhaseMachineResult.err) {
      throw initPhaseMachineResult.err
    }

    const { err, val } = await subscriptionService.cancelSubscription({
      cancelAt: endAt,
      now: Date.now(),
      metadata: metadata ?? undefined,
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    return {
      status: val.phaseStatus,
      message: "Subscription changed successfully",
    }
  })
