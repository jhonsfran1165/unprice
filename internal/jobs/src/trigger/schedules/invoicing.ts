import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db, notInArray } from "@unprice/db"
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
      with: {
        phases: {
          where: (phase, { eq, and }) =>
            and(eq(phase.active, true), notInArray(phase.status, ["trialing"])),
        },
      },
      where: (sub, { eq, and, lte, isNull }) =>
        and(
          eq(sub.active, true),
          lte(sub.nextInvoiceAt, now),
          // we don't invoice if there is a change, cancel or expire scheduled
          isNull(sub.cancelAt),
          isNull(sub.pastDueAt),
          isNull(sub.expiresAt),
          isNull(sub.changeAt)
        ),
    })

    logger.info(`Found ${subscriptions.length} subscriptions for invoicing`)

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptions) {
      const phase = sub.phases[0]

      if (!phase) {
        logger.error(`No active phase found for subscription ${sub.id}`)
        continue
      }

      const result = await invoiceTask.triggerAndWait({
        subscriptionId: sub.id,
        projectId: sub.projectId,
        now: sub.nextInvoiceAt + 1,
        phaseId: phase.id,
      })

      if (result.ok && phase.autoRenew) {
        // renew the subscription right after the invoice is created
        await renewTask.triggerAndWait({
          subscriptionId: sub.id,
          projectId: sub.projectId,
          now: sub.nextInvoiceAt + 1,
          phaseId: phase.id,
        })
      }
    }

    return {
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
