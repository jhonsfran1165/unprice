import { db, eq } from "@unprice/db"
import { subscriptions } from "@unprice/db/schema"
import type { SubscriptionMetadata } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"
import { env } from "#env.mjs"
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
export const updateMetadataSubscription = async ({
  context,
  metadata,
}: {
  context: SubscriptionContext
  metadata: SubscriptionMetadata
}): Promise<void> => {
  // update the metadata for the subscription
  const newMetadata = {
    ...context.subscription.metadata,
    ...metadata,
  }

  // update the subscription
  await db
    .update(subscriptions)
    .set({
      metadata: newMetadata,
    })
    .where(eq(subscriptions.id, context.subscriptionId))
}
