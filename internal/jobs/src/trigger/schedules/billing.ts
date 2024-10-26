import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { billingTask } from "../tasks/billing"

export const billingSchedule = schedules.task({
  id: "subscriptionPhase.billing",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    // TODO: get the current time - this is just for testing
    const now = new Date("2024-11-18T00:00:00.000Z").getTime()

    // find all subscriptions phases that are currently in trial and the trial ends at is in the past
    const pendingInvoices = await db.query.invoices.findMany({
      where: (table, { inArray, and, lte }) =>
        and(inArray(table.status, ["draft", "unpaid"]), lte(table.dueAt, now)),
      limit: 1000,
    })

    // trigger the end trial task for each subscription phase
    for (const invoice of pendingInvoices) {
      await billingTask.triggerAndWait({
        subscriptionPhaseId: invoice.subscriptionPhaseId,
        invoiceId: invoice.id,
        projectId: invoice.projectId,
      })
    }

    logger.info(`Found ${pendingInvoices.length} pending invoices`)

    return {
      invoiceIds: pendingInvoices.map((i) => i.id),
    }
  },
})
