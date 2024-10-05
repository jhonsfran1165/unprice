import { TRPCError } from "@trpc/server"
import { subscriptionInsertSchema, subscriptionSelectSchema } from "@unprice/db/validators"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

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

    const subscriptionService = new SubscriptionService({
      db: opts.ctx.db,
      cache: opts.ctx.cache,
      metrics: opts.ctx.metrics,
      logger: opts.ctx.logger,
      waitUntil: opts.ctx.waitUntil,
      analytics: opts.ctx.analytics,
    })

    const { err, val } = await subscriptionService.createSubscription({
      input: opts.input,
      projectId: opts.ctx.project.id,
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    return {
      subscription: val,
    }
  })
