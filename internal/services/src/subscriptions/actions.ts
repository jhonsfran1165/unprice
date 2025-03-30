import { and, eq } from "@unprice/db"
import { subscriptions } from "@unprice/db/schema"
import type { Subscription } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"
import { env } from "../../env"
import { db } from "../utils/db"
import type { SubscriptionContext, SubscriptionEvent } from "./types"

/**
 * Action: Log state transition
 */
export const logTransition = ({
  context,
  event,
  logger,
}: {
  context: SubscriptionContext
  event: SubscriptionEvent
  logger: Logger
}): void => {
  if (env.NODE_ENV === "development") {
    if (!context.currentPhase) {
      logger.info(`Subscription ${context.subscriptionId} has no current phase`)
    }

    if (context.error) {
      logger.error(`Subscription ${context.subscriptionId} error: ${context.error.message}`)
    }

    console.info(`Subscription ${context.subscriptionId} state transition: ${event.type}`)
  }
}

/**
 * Action: Send notification to customer
 */
export const sendCustomerNotification = ({
  context,
  event,
  logger,
}: {
  context: SubscriptionContext
  event: SubscriptionEvent
  logger: Logger
}): void => {
  logger.info(
    `Notifying customer about subscription ${context.subscriptionId} event: ${event.type}`
  )
}

/**
 * Action: Update metadata for subscription
 */
export const updateSubscription = async ({
  context,
  subscription,
}: {
  context: SubscriptionContext
  subscription: Partial<Subscription>
}): Promise<void> => {
  const { subscriptionId, projectId } = context

  // update the subscription
  await db
    .update(subscriptions)
    .set({
      ...subscription,
    })
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.projectId, projectId)))
}
