import { connectDatabase } from "@/lib/db"
import { client } from "@/trigger"
import { cronTrigger } from "@trigger.dev/sdk"
import { createInvoiceJob } from "./create-invoice"

// Your first job
// This Job will be triggered by an event, log a joke to the console, and then wait 5 seconds before logging the punchline.
client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project.
  id: "billing-example",
  name: "Billing Example",
  version: "0.0.1",
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: cronTrigger({
    cron: "0 0 0 1 1/1 ? *", // First of each month at 00:00 UTC
  }),
  run: async (_payload, io, _ctx) => {
    // Get the number of subscriptions in the database
    const db = connectDatabase()

    const subscriptions = await db.query.subscriptions.findMany()

    await io.logger.info(`Found ${subscriptions.length} subscriptions`)

    // current year and month
    const t = new Date()
    t.setUTCMonth(t.getUTCMonth() - 1)
    const year = t.getUTCFullYear()
    const month = t.getUTCMonth() + 1 // months are 0 indexed

    // create a new invoice for each subscription
    if (subscriptions.length > 0) {
      await createInvoiceJob.batchInvokeAndWaitForCompletion(
        "invoice customers",
        subscriptions.map((sub) => ({
          payload: {
            subscriptionId: sub.id,
            customerId: sub.customerId,
            year,
            month,
          },
        }))
      )
    }

    return {
      subscriptionIds: subscriptions.map((sub) => sub.id),
    }
  },
})
