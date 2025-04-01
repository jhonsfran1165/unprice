import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { invoiceTask } from "../tasks/invoice"

export const invoicingSchedule = schedules.task({
  id: "subscriptionPhase.invoicing",
  // every 12 hours (UTC timezone)
  // if dev then every 5 minutes in dev mode
  cron: process.env.NODE_ENV === "development" ? "*/5 * * * *" : "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    // get the subscription ready for billing
    const subscriptions = await db.query.subscriptions.findMany({
      with: {
        phases: {
          where: (phase, { lte, and, gte, isNull, or }) =>
            and(lte(phase.startAt, now), or(isNull(phase.endAt), gte(phase.endAt, now))),
        },
      },
      where: (sub, { eq, and, lte }) => and(eq(sub.active, true), lte(sub.invoiceAt, now)),
    })

    logger.info(`Found ${subscriptions.length} subscriptions for invoicing`)

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptions) {
      const phase = sub.phases[0]

      if (!phase) {
        logger.error(`No active phase found for subscription ${sub.id}, skipping`)
        continue
      }

      await invoiceTask.triggerAndWait({
        subscriptionId: sub.id,
        projectId: sub.projectId,
        now,
        phaseId: phase.id,
      })
    }

    return {
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
