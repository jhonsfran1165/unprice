import { TRPCError } from "@trpc/server"
import { phaseStatusSchema, subscriptionPhaseSelectSchema } from "@unprice/db/validators"
import { SubscriptionStateMachine } from "@unprice/services/subscriptions"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const cancelPhase = protectedProjectProcedure
  .input(subscriptionPhaseSelectSchema.pick({ id: true, endAt: true }))
  .output(z.object({ status: phaseStatusSchema, message: z.string() }))
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

    const { err, val: cancel } = await subscriptionStateMachine.cancel({
      cancelAt: endAt ?? Date.now(),
      now: Date.now(),
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Error cancelling subscription phase: ${err.message}`,
      })
    }

    return {
      status: cancel.status,
      message: "Subscription changed successfully",
    }
  })
