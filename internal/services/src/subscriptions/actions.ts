import { and, eq } from "@unprice/db"
import { subscriptions } from "@unprice/db/schema"
import type { Subscription } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"

import { db } from "@unprice/db"
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
  if (!context.currentPhase) {
    logger.info(`Subscription ${context.subscriptionId} has no current phase`, {
      subscriptionId: context.subscriptionId,
      customerId: context.customer.id,
      projectId: context.projectId,
      now: context.now,
      event: JSON.stringify(event),
    })
  }

  if (context.error) {
    logger.error(`Subscription ${context.subscriptionId} error: ${context.error.message}`, {
      subscriptionId: context.subscriptionId,
      customerId: context.customer.id,
      currentPhaseId: context.currentPhase?.id,
      projectId: context.projectId,
      now: context.now,
      event: JSON.stringify(event),
    })
  }

  logger.info(`Subscription ${context.subscriptionId} state transition: ${event.type}`)
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
