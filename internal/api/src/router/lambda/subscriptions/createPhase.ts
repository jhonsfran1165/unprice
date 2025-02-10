import {
  subscriptionPhaseInsertSchema,
  subscriptionPhaseSelectSchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { SubscriptionService } from "#services/subscriptions"

import { TRPCError } from "@trpc/server"
import { protectedProjectProcedure } from "#trpc"

export const createPhase = protectedProjectProcedure
  .input(subscriptionPhaseInsertSchema)
  .output(z.object({ phase: subscriptionPhaseSelectSchema }))
  .mutation(async (opts) => {
    const projectId = opts.ctx.project.id

    const subscriptionService = new SubscriptionService(opts.ctx)

    const { err, val } = await subscriptionService.createPhase({
      input: opts.input,
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
      phase: val,
    }
  })
