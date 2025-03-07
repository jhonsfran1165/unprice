import {
  type SubscriptionPhase,
  subscriptionPhaseInsertSchema,
  subscriptionPhaseSelectSchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const createPhase = protectedProjectProcedure
  .input(subscriptionPhaseInsertSchema)
  .output(z.object({ phase: subscriptionPhaseSelectSchema }))
  .mutation(async () => {
    return {
      phase: {} as SubscriptionPhase,
    }
  })
