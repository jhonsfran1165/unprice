import { subscriptionPhaseSelectSchema } from "@unprice/db/validators"
import { SubscriptionStateMachine } from "@unprice/services/subscriptions"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

// TODO: review this is a pseudo code
export const cancelPhase = protectedProjectProcedure
  .input(subscriptionPhaseSelectSchema.pick({ id: true, endAt: true }))
  .output(z.object({ result: z.boolean(), message: z.string() }))
  .mutation(async (opts) => {
    const { id: subscriptionPhaseId, endAt } = opts.input
    const projectId = opts.ctx.project.id

    const subscriptionPhase = await opts.ctx.db.query.subscriptionPhases.findFirst({
      with: {
        subscription: {
          with: {
            customer: true,
          },
        },
        items: {
          with: {
            featurePlanVersion: {
              with: {
                feature: true,
              },
            },
          },
        },
        planVersion: {
          with: {
            planFeatures: true,
          },
        },
      },
      where: (table, { eq, and }) =>
        and(eq(table.id, subscriptionPhaseId), eq(table.projectId, projectId)),
    })

    if (!subscriptionPhase) {
      throw new Error("Subscription phase not found")
    }

    const subscriptionStateMachine = new SubscriptionStateMachine({
      db: opts.ctx.db,
      activePhase: subscriptionPhase,
      subscription: subscriptionPhase.subscription,
      customer: subscriptionPhase.subscription.customer,
      analytics: opts.ctx.analytics,
      logger: opts.ctx.logger,
    })

    await subscriptionStateMachine.cancel({
      cancelAt: endAt ?? Date.now(),
      now: Date.now(),
    })

    return {
      result: true,
      message: "Subscription changed successfully",
    }
  })
