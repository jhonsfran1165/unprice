import { protectedProjectProcedure } from "#trpc"
import {
  type SubscriptionPhase,
  subscriptionPhaseInsertSchema,
  subscriptionPhaseSelectSchema,
} from "@unprice/db/validators"
import { z } from "zod"

export const createPhase = protectedProjectProcedure
  .input(subscriptionPhaseInsertSchema)
  .output(z.object({ phase: subscriptionPhaseSelectSchema }))
  .mutation(async () => {
    // TODO: implement

    return {
      phase: {} as SubscriptionPhase,
    }
  })
