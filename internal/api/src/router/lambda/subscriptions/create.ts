import { subscriptionInsertSchema, subscriptionSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { createSubscription } from "../../../utils/shared"

export const create = protectedProjectProcedure
  .input(subscriptionInsertSchema)
  .output(
    z.object({
      subscription: subscriptionSelectSchema,
    })
  )
  .mutation(async (opts) => {
    // only owner and admin can create a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const { subscription } = await createSubscription({
      subscription: opts.input,
      projectId: opts.ctx.project.id,
      ctx: opts.ctx,
    })

    return {
      subscription: subscription,
    }
  })
