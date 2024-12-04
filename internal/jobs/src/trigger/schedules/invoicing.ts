import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { renewTask } from "../tasks"
import { invoiceTask } from "../tasks/invoice"

export const invoicingSchedule = schedules.task({
  id: "subscriptionPhase.invoicing",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    // get the subscription ready for billing
    const subscriptions = await db.query.subscriptions.findMany({
      where: (sub, { eq, and, lte }) => and(eq(sub.active, true), lte(sub.nextInvoiceAt, now)),
    })

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptions) {
      await invoiceTask.triggerAndWait({
        subscriptionId: sub.id,
        projectId: sub.projectId,
        now,
      })

      // first invoice is free, so we renew the subscription
      await renewTask.triggerAndWait({
        subscriptionId: sub.id,
        projectId: sub.projectId,
        now,
      })
    }

    logger.info(`Found ${subscriptions.length} subscriptions for invoicing`)

    return {
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
