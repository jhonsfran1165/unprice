import { subscriptionChangePlanSchema, subscriptionStatusSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const changePhasePlan = protectedProjectProcedure
  .input(subscriptionChangePlanSchema)
  .output(z.object({ status: subscriptionStatusSchema, message: z.string() }))
  .mutation(async (opts) => {
    // only owner and admin can cancel a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // TODO: implement

    return {
      status: "active",
      message: "Subscription changed successfully",
    }
  })
