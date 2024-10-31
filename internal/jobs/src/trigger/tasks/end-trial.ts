import { task } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { newId } from "@unprice/db/utils"
import { ConsoleLogger } from "@unprice/logging"
import { SubscriptionStateMachine } from "@unprice/services/subscriptions"
import { Analytics } from "@unprice/tinybird"
import { env } from "../../env.mjs"

export const endTrialTask = task({
  id: "subscription.phase.endtrial",
  retry: {
    maxAttempts: 1,
  },
  run: async ({
    subscriptionPhaseId,
    projectId,
    now,
  }: {
    subscriptionPhaseId: string
    projectId: string
    now: number
  }) => {
    const tinybird = new Analytics({
      emit: true,
      tinybirdToken: env.TINYBIRD_TOKEN,
    })

    const requestId = newId("request")

    const logger = new ConsoleLogger({
      requestId,
      defaultFields: {
        subscriptionPhaseId,
        projectId,
        now,
        api: "jobs.subscription.phase.endtrial",
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
      activePhase: subscriptionPhase,
      subscription: subscriptionPhase.subscription,
      customer: subscriptionPhase.subscription.customer,
      analytics: tinybird,
      logger: logger,
    })

    const result = await subscriptionStateMachine.endTrial({ now })

    // we have to throw if there is an error so the task fails
    if (result.err) {
      throw result.err
    }

    return result.val
  },
})
