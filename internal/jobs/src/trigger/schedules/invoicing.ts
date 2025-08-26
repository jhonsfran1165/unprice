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

    const subscriptionsWithActivePhase = subscriptions.filter((sub) => sub.phases.length > 0)

    logger.info(`Found ${subscriptionsWithActivePhase.length} subscriptions for invoicing`)

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptionsWithActivePhase) {
      const phase = sub.phases[0]!

      await invoiceTask.triggerAndWait({
        subscriptionId: sub.id,
        projectId: sub.projectId,
        now,
        phaseId: phase.id,
      })
    }

    return {
      subscriptionIds: subscriptionsWithActivePhase.map((s) => s.id),
    }
  },
})
