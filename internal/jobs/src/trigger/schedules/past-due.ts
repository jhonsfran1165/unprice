import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import {
  cancelSubscriptionTask,
  createSubscriptionChangeTask,
  invoiceSubscriptionTask,
} from "../tasks"

// TODO: implement this way
// const createdSchedule = await schedules.create({
//   //The id of the scheduled task you want to attach to.
//   task: firstScheduledTask.id,
//   //The schedule in cron format.
//   cron: "0 0 * * *",
//   //this is required, it prevents you from creating duplicate schedules. It will update the schedule if it already exists.
//   deduplicationKey: "my-deduplication-key",
// timezone: "America/New_York"
// });

export const pastDueTask = schedules.task({
  id: "subscription.past.due",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    // TODO: get the current time - this is just for testing
    const now = new Date("2024-11-01T00:00:00.000Z").getTime()

    // the main idea here is find subs that are past due and check the reason why they are past due
    // we can have two types of past due:
    // 1. the subscription is past due because the customer has a payment method but the invoice failed
    // 2. the subscription is past due because the customer does not have a payment method

    // for the first type we need to check the invoice status and if it is not paid, we need to either downgrage the plan or cancel the subscription
    // we have to check the grace period before doing any of this
    // for the second type we need to check if the customer has a payment method and if not, we need to cancel/downgrage the subscription

    // find all those subscriptions that are currently in past due
    const subscriptions = await db.query.subscriptions.findMany({
      where: (table, { eq, and, lte }) =>
        and(eq(table.status, "past_due"), eq(table.active, true), lte(table.pastDueAt, now)),
      with: {
        planVersion: true,
        customer: true,
      },
      limit: 1000, // process 1000 subscriptions max per run
    })

    for (const sub of subscriptions) {
      const reason = sub.metadata?.reason || "unknown"
      const dueBehaviour = sub.metadata?.dueBehaviour || "downgrade"

      switch (reason) {
        case "payment_failed": {
          // first type: the subscription is past due because the customer has a payment method but the invoice failed
          // check invoice status
          const invoice = await db.query.billingCycleInvoices.findFirst({
            where: (table, { eq, and }) =>
              and(eq(table.subscriptionId, sub.id), eq(table.status, "unpaid")),
          })

          if (!invoice) {
            logger.error(`Subscription ${sub.id} has no invoice`)
            continue
          }

          // check the invoice status
          if (invoice.status === "unpaid") {
            logger.info(`Subscription ${sub.id} has an unpaid invoice`)
          }
          break
        }

        case "payment_method_not_found": {
          // second type: the subscription is past due because the customer does not have a payment method
          // check if the subscription requires a payment method and if the customer hasn't one
          const requiredPaymentMethod = sub.planVersion.paymentMethodRequired
          // TODO: we need to get the payment method from the current one the customers has
          const hasPaymentMethod =
            sub.defaultPaymentMethodId ?? sub.customer.metadata?.stripeDefaultPaymentMethodId

          if (requiredPaymentMethod && !hasPaymentMethod) {
            if (dueBehaviour === "cancel") {
              await cancelSubscriptionTask.triggerAndWait({
                subscriptionId: sub.id,
                customerId: sub.customerId,
                currentDate: now,
                immediate: true,
              })
            } else if (dueBehaviour === "downgrade") {
              // TODO: create a new subscription change

              await createSubscriptionChangeTask.triggerAndWait({
                subscriptionId: sub.id,
                date: now,
                whenToApply: "inmidiate",
                changeType: "downgrade",
              })
            }
          } else {
            // invoice the subscription
            await invoiceSubscriptionTask.triggerAndWait({
              subscriptionId: sub.id,
              customerId: sub.customerId,
              // TODO: we need to get the current date here
              currentDate: now,
            })
          }
          break
        }

        default: {
          logger.error(`Subscription ${sub.id} has an unknown reason for past due`)
        }
      }
    }

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      message: "Hello, world!",
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
