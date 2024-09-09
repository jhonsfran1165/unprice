import { logger, schedules } from "@trigger.dev/sdk/v3"
import { and, db, eq, gte, isNotNull, or } from "@unprice/db"
import * as schema from "@unprice/db/schema"

export const endTrialsTask = schedules.task({
  id: "billing.end.trials",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    const now = new Date("2024-11-01T00:00:00.000Z").getTime()

    // the Idea here is to change the status of the subscription once they are no longer in trial
    // and depending on the planConfiguration, we either downgrade the plan or cancel the subscription

    // TODO: handle this properly
    // find all those subscriptions that are currently in trial and the trial ends at is in the past
    const subscriptions = await db
      .select({
        subscription: schema.subscriptions,
        planVersion: schema.versions,
        customer: schema.customers,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.projects, and(eq(schema.subscriptions.projectId, schema.projects.id)))
      .innerJoin(
        schema.versions,
        and(
          eq(schema.subscriptions.planVersionId, schema.versions.id),
          eq(schema.subscriptions.projectId, schema.versions.projectId)
        )
      )
      .innerJoin(schema.customers, eq(schema.subscriptions.customerId, schema.customers.id))
      .where(
        and(
          eq(schema.versions.planType, "recurring"),
          eq(schema.subscriptions.status, "trialing"),
          or(
            isNotNull(schema.subscriptions.trialEndsAt),
            gte(schema.subscriptions.trialEndsAt, now)
          )
        )
      )

    for (const subscription of subscriptions) {
      const sub = subscription.subscription
      const planVersion = subscription.planVersion

      const requiredPaymentMethod = planVersion.paymentMethodRequired
      const hasPaymentMethod = sub.defaultPaymentMethodId

      if (requiredPaymentMethod && !hasPaymentMethod) {
        // change the status of the subscription to past_due
        await db
          .update(schema.subscriptions)
          .set({ status: "past_due" })
          .where(eq(schema.subscriptions.id, sub.id))
      }
    }

    // for subscription ending trials we need to:
    // - verify if the customer has a valid payment method
    // - if not change the status of the subscription to past_due
    // - if so we validate if the subscription is bill at the start of the billing cycle
    // if so we create an invoice and bill the customer or charge the customer automatically
    // if not we change the status of the subscription to past_due and wait until the past due date expires
    // after that we cancel the subscription and create a new one with the next plan to the default plan
    // if the customer has a valid payment method and the subscription is not bill at the start of the billing cycle
    // we change the status of the subscription to active and bill the customer at the end of the billing cycle
    // if past due we send a reminder email to the customer and the invoice.

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      message: "Hello, world!",
      subscriptionIds: subscriptions.map((s) => s.subscription.id),
    }
  },
})
