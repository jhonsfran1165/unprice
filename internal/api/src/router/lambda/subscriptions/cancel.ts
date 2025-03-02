import { protectedProjectProcedure } from "#trpc"
import { subscriptionSelectSchema, subscriptionStatusSchema } from "@unprice/db/validators"
import { z } from "zod"

export const cancel = protectedProjectProcedure
  .input(
    subscriptionSelectSchema.pick({ id: true, metadata: true }).extend({
      endAt: z.number().optional(),
    })
  )
  .output(z.object({ status: subscriptionStatusSchema, message: z.string() }))
  .mutation(async (opts) => {
    // only owner and admin can cancel a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // TODO: implement

    return {
      status: "canceled",
      message: "Subscription canceled successfully",
    }
  })
