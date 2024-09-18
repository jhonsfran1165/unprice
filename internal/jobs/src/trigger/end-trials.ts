import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { invoiceSubscriptionTask } from "./tasks"

export const endTrialsTask = schedules.task({
  id: "subscription.end.trials",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    // TODO: get the current time - this is just for testing
    const now = new Date("2024-11-01T00:00:00.000Z").getTime()

    // the Idea here is to change the status of the subscription once they are no longer in trial
    // and depending on the planConfiguration, we either downgrade the plan or cancel the subscription

    // find all those subscriptions that are currently in trial and the trial ends at is in the past
    const subscriptions = await db.query.subscriptions.findMany({
      where: (table, { eq, and, lte }) =>
        and(eq(table.status, "trialing"), lte(table.trialEndsAt, now), eq(table.active, true)),
      limit: 1000,
    })

    for (const sub of subscriptions) {
      // invoice the subscription - this will try to invoice the subscription if the customer has a payment method
      // if not, the subscription will be marked as past_due
      // if everything is ok, the subscription will be marked as active
      await invoiceSubscriptionTask.triggerAndWait({
        subscriptionId: sub.id,
        customerId: sub.customerId,
        // TODO: we need to get the current date here
        currentDate: now,
      })
    }

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      message: "Hello, world!",
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
