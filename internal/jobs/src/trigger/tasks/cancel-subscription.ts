import { logger, task } from "@trigger.dev/sdk/v3"
import { db, eq } from "@unprice/db"
import { subscriptions } from "@unprice/db/schema"
import { invoiceSubscriptionTask } from "./invoice-sub"

export const cancelSubscriptionTask = task({
  id: "cancel.subscription",
  run: async ({
    subscriptionId,
    customerId,
    currentDate,
    immediate = false,
  }: {
    subscriptionId: string
    customerId: string
    currentDate: number
    immediate?: boolean
  }) => {
    // find the subscription
    const subscription = await db.query.subscriptions.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, subscriptionId),
          operators.eq(fields.customerId, customerId),
          // if immediate is true, we don't need to check the cancelAt date
          !immediate ? operators.lte(fields.cancelAt, currentDate) : undefined,
          operators.eq(fields.active, true)
        )
      },
    })

    if (!subscription) {
      logger.error(
        `Subscription ${subscriptionId} not found or it should not be cancelled at this time`
      )
      return
    }

    if (["canceled", "expired", "changing"].includes(subscription.status)) {
      logger.info(
        `Subscription ${subscriptionId} has a status that cannot be cancelled ${subscription.status}`
      )
      return
    }

    // check if the subscription was already canceled
    if (subscription.status === "canceled") {
      logger.info(`Subscription ${subscriptionId} is already canceled`)
      return
    }

    // TODO: check if there is an invoice pending
    // here we need to check the time where the invoice has to be billed, if it was invoiced at the
    // start then we just need to invoice for the usage.
    // if the invoice is at the end of the cycle we invoice prorated and set the subscription to cancel

    // cancel the subscription
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: currentDate,
        nextInvoiceAt: currentDate,
        currentCycleEndAt: currentDate,
        endAt: currentDate,
        active: false,
      })
      .where(eq(subscriptions.id, subscriptionId))

    // invoice the subscription
    await invoiceSubscriptionTask.triggerAndWait({
      subscriptionId: subscriptionId,
      customerId: customerId,
      currentDate: currentDate,
    })
  },
})
