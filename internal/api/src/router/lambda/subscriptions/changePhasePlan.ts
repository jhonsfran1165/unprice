import { TRPCError } from "@trpc/server"
import { phaseStatusSchema, subscriptionChangePlanSchema } from "@unprice/db/validators"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const changePhasePlan = protectedProjectProcedure
  .input(subscriptionChangePlanSchema)
  .output(z.object({ status: phaseStatusSchema, message: z.string() }))
  .mutation(async (opts) => {
    // only owner and admin can cancel a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const { planVersionId, config, whenToChange, id: subscriptionId, projectId } = opts.input

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

    const activeSubscription = await subscriptionService.getActiveSubscription()

    // if the change is at the end of the cycle, we use the current cycle end date
    // if the change is now, we use the current date
    const changeAt =
      whenToChange === "immediately"
        ? Date.now()
        : activeSubscription.val?.currentCycleEndAt ?? Date.now()

    // all important validations are done in the phase machine
    const { err, val } = await subscriptionService.changeSubscription({
      changeAt: changeAt,
      now: Date.now(),
      metadata: {
        note: `Change phase plan to ${planVersionId} at ${new Date(changeAt).toISOString()}`,
        reason: "admin_requested",
      },
      newPhase: {
        planVersionId,
        config,
        subscriptionId,
        // startAt is overwritten after validation of the changeAt
        startAt: changeAt + 1,
      },
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    return {
      status: val.newPhaseStatus,
      message: "Subscription changed successfully",
    }
  })
