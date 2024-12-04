import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { pastDueTask } from "../tasks/pastdue"

export const pastDueSchedule = schedules.task({
  id: "invoices.pastdue",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    // get the invoices that are past due and not paid or voided
    const invoices = await db.query.invoices.findMany({
      where: (inv, { and, lte, inArray }) =>
        and(inArray(inv.status, ["unpaid", "failed", "waiting"]), lte(inv.pastDueAt, now)),
    })

    // trigger the past due task for each invoice
    for (const inv of invoices) {
      await pastDueTask.triggerAndWait({
        invoiceId: inv.id,
        projectId: inv.projectId,
        phaseId: inv.subscriptionPhaseId,
        subscriptionId: inv.subscriptionId,
        now,
      })
    }

    logger.info(`Found ${invoices.length} invoices for past due`)

    return {
      invoiceIds: invoices.map((i) => i.id),
    }
  },
})
