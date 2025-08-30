import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "../db"
import { billingTask } from "../tasks/billing"
import { finilizeTask } from "../tasks/finilize"

export const billingSchedule = schedules.task({
  id: "subscriptionPhase.billing",
  // if dev then every 1 minute in dev mode
  cron: process.env.NODE_ENV === "development" ? "*/1 * * * *" : "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    // find all subscriptions phases that are currently in trial and the trial ends at is in the past
    const pendingInvoices = await db.query.invoices.findMany({
      where: (table, { inArray, and, lte }) =>
        and(inArray(table.status, ["draft", "unpaid", "waiting"]), lte(table.dueAt, now)),
      limit: 1000,
      with: {
        subscriptionPhase: true,
      },
    })

    // trigger the end trial task for each subscription phase
    for (const invoice of pendingInvoices) {
      const isNotFinalize = invoice.status === "draft"

      if (isNotFinalize) {
        try {
          await finilizeTask.triggerAndWait({
            subscriptionPhaseId: invoice.subscriptionPhaseId,
            invoiceId: invoice.id,
            projectId: invoice.projectId,
            subscriptionId: invoice.subscriptionPhase.subscriptionId,
            now,
          })
        } catch (err) {
          logger.error(`Failed to finalize invoice ${invoice.id}`, {
            error: err instanceof Error ? err.message : "Unknown error",
          })

          continue
        }
      }

      await billingTask.triggerAndWait({
        subscriptionPhaseId: invoice.subscriptionPhaseId,
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        subscriptionId: invoice.subscriptionPhase.subscriptionId,
        now,
      })
    }

    logger.info(`Found ${pendingInvoices.length} pending invoices`)

    return {
      invoiceIds: pendingInvoices.map((i) => i.id),
    }
  },
})
