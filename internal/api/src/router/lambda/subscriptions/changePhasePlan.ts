import { SubscriptionService } from "#services/subscriptions"
import { protectedProjectProcedure } from "#trpc"
import { TRPCError } from "@trpc/server"
import { subscriptionChangePlanSchema, subscriptionStatusSchema } from "@unprice/db/validators"
import { z } from "zod"

export const changePhasePlan = protectedProjectProcedure
  .input(subscriptionChangePlanSchema)
  .output(z.object({ status: subscriptionStatusSchema, message: z.string() }))
  .mutation(async (opts) => {
    // only owner and admin can cancel a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const { whenToChange, id: subscriptionId, projectId } = opts.input

    const subscriptionService = new SubscriptionService(opts.ctx)

    // init phase machine
    const initPhaseMachineResult = await subscriptionService.initPhaseMachines({
      subscriptionId: subscriptionId,
      projectId,
    })

    if (initPhaseMachineResult.err) {
      throw initPhaseMachineResult.err
    }

    const activeSubscription = await subscriptionService.getActiveSubscription()

    if (activeSubscription.err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: activeSubscription.err.message,
      })
    }

    // if the change is at the end of the cycle, we use the current cycle end date
    // if the change is now, we use the current date
    const _changeAt =
      whenToChange === "immediately"
        ? Date.now()
        : (activeSubscription.val?.currentCycleEndAt ?? Date.now())

    // TODO: implement

    return {
      status: "active",
      message: "Subscription changed successfully",
    }
  })
