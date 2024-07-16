import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import { cronTrigger } from "@trigger.dev/sdk"
import { connectDatabase } from "~/lib/db"
import { client } from "~/trigger"
import { createInvoiceStripeJob } from "."

// Your first job
// This Job will be triggered by an event, log a joke to the console, and then wait 5 seconds before logging the punchline.
client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project.
  id: "billing.invoicing.recurring",
  name: "Billing Recurring Subscriptions",
  version: "0.0.1",
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: cronTrigger({
    cron: "0 0 0 1 1/1 ? *", // First of each month at 00:00 UTC
  }),
  run: async (_payload, io, _ctx) => {
    // Get the number of subscriptions in the database
    // TODO: create connection from in lib/db and not importing it from @builderai/db
    const db = connectDatabase()

    // find all those subscriptions that are active and recurring
    const subscriptions = await db
      .select({
        subscription: schema.subscriptions,
        planVersion: schema.versions,
      })
      .from(schema.subscriptions)
      .innerJoin(
        schema.projects,
        and(
          eq(schema.subscriptions.projectId, schema.projects.id),
          eq(schema.projects.isInternal, true) // TODO: change this to false
        )
      )
      .innerJoin(
        schema.versions,
        and(
          eq(schema.subscriptions.planVersionId, schema.versions.id),
          eq(schema.subscriptions.projectId, schema.versions.projectId)
        )
      )
      .where(
        and(eq(schema.subscriptions.status, "active"), eq(schema.versions.planType, "recurring"))
      )

    await io.logger.info(`Found ${subscriptions.length} subscriptions`)

    // current year and month
    const t = new Date()
    t.setUTCMonth(t.getUTCMonth() - 1)
    const year = t.getUTCFullYear()
    const month = t.getUTCMonth() + 1 // months are 0 indexed

    // create a new invoice for each subscription
    if (subscriptions.length > 0) {
      // stripe invoices
      await createInvoiceStripeJob.batchInvokeAndWaitForCompletion(
        "create stripe invoice for each subscriptions",
        subscriptions
          .filter((sub) => sub.planVersion.paymentProvider === "stripe")
          .map((sub) => ({
            payload: {
              subscriptionId: sub.subscription.id,
              customerId: sub.subscription.customerId,
              year,
              month,
            },
          }))
      )
    }

    return {
      subscriptionIds: subscriptions.map((sub) => sub.subscription.id),
    }
  },
})
