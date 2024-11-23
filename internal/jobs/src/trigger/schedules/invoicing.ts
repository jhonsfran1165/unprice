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
      with: {
        phases: {
          // get active phase now
          where: (phase, { eq, and, gte, lte, isNull, or, not }) =>
            and(
              eq(phase.active, true),
              not(eq(phase.status, "trialing")),
              lte(phase.startAt, now),
              or(isNull(phase.endAt), gte(phase.endAt, now))
            ),
          // phases are don't overlap, so we can use limit 1
          limit: 1,
        },
      },
      where: (sub, { eq, and, lte }) => and(eq(sub.active, true), lte(sub.nextInvoiceAt, now)),
    })

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptions) {
      const phase = sub.phases[0]

      if (!phase) {
        throw new Error("Subscription phase not found or there is no active phase")
      }

      await invoiceTask.triggerAndWait({
        subscriptionPhaseId: phase.id,
        projectId: sub.projectId,
        now,
      })

      // first invoice is free, so we renew the subscription
      await renewTask.triggerAndWait({
        subscriptionId: sub.id,
        projectId: phase.projectId,
        now,
      })
    }

    logger.info(`Found ${subscriptions.length} subscriptions for invoicing`)

    return {
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
