import { task } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { ConsoleLogger } from "@unprice/logging"
import { SubscriptionStateMachine } from "@unprice/services/subscriptions"
import { Analytics } from "@unprice/tinybird"
import { env } from "../../env.mjs"

export const billingTask = task({
  id: "subscription.phase.billing",
  run: async (
    {
      subscriptionPhaseId,
      invoiceId,
      projectId,
    }: {
      subscriptionPhaseId: string
      projectId: string
      invoiceId: string
    },
    { ctx }
  ) => {
    const tinybird = new Analytics({
      emit: true,
      tinybirdToken: env.TINYBIRD_TOKEN,
    })

    const logger = new ConsoleLogger({
      requestId: ctx.task.id,
      defaultFields: {
        subscriptionPhaseId,
        invoiceId,
        projectId,
        api: "subscription.phase.billing",
      },
    })

    const subscriptionPhase = await db.query.subscriptionPhases.findFirst({
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

    if (!subscriptionPhase.subscription) {
      throw new Error("Subscription not found")
    }

    if (!subscriptionPhase.subscription.customer) {
      throw new Error("Customer not found")
    }

    const subscriptionStateMachine = new SubscriptionStateMachine({
      db: db,
      subscriptionPhase: subscriptionPhase,
      subscription: subscriptionPhase.subscription,
      customer: subscriptionPhase.subscription.customer,
      analytics: tinybird,
      logger: logger,
    })

    return await subscriptionStateMachine.billing({ invoiceId })
  },
})
