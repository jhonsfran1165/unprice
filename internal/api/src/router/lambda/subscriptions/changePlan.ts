import { TRPCError } from "@trpc/server"
import { subscriptionChangePlanSchema } from "@unprice/db/validators"
import { SubscriptionService, SubscriptionStateMachine } from "@unprice/services/subscriptions"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

// TODO: review this is a pseudo code
export const changePlan = protectedProjectProcedure
  .input(subscriptionChangePlanSchema)
  .output(z.object({ result: z.boolean(), message: z.string() }))
  .mutation(async (opts) => {
    const {
      id: subscriptionId,
      customerId,
      phases,
      projectId,
    } = opts.input

    if (!phases || phases.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No phases found" })
    }

    const phase = phases[0]

    if (!phase) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No phase found" })
    }

    const subscriptionService = new SubscriptionService({
      db: opts.ctx.db,
      cache: opts.ctx.cache,
      metrics: opts.ctx.metrics,
      logger: opts.ctx.logger,
      waitUntil: opts.ctx.waitUntil,
      analytics: opts.ctx.analytics,
    })

    // TODO: end phase before creating a new one

    const subscriptionPhaseResult = await subscriptionService.createPhase({
      input: phase,
      subscriptionId,
      projectId,
    })

    if (subscriptionPhaseResult.err) {
      throw new TRPCError({ code: "BAD_REQUEST", message: subscriptionPhaseResult.err.message })
    }

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
        and(eq(table.id, subscriptionPhaseResult.val.id), eq(table.projectId, projectId)),
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

    await subscriptionStateMachine.change({
      changeAt: phase.startAt,
      now: Date.now(),
    })

    return {
      result: true,
      message: "Subscription changed successfully",
    }
  })
