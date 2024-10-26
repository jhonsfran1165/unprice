import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { invoiceTask } from "../tasks/invoice"

export const billingSchedule = schedules.task({
  id: "billing.recurring.subscriptions",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    const now = new Date("2024-11-01T00:00:00.000Z").getTime()

    // get the subscription ready for billing
    const subscriptions = await db.query.subscriptions.findMany({
      with: {
        phases: {
          // get active phase now
          where: (phase, { eq, and, gte, lte, isNull, or }) =>
            and(
              eq(phase.active, true),
              lte(phase.startAt, now),
              or(isNull(phase.endAt), gte(phase.endAt, now))
            ),
          // phases are don't overlap, so we can use limit 1
          limit: 1,
        },
      },
      where: (sub, { eq, and, gte }) => and(eq(sub.active, true), gte(sub.nextInvoiceAt, now)),
    })

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptions) {
      const phase = sub.phases[0]

      if (!phase) {
        throw new Error("Subscription phase not found")
      }

      await invoiceTask.triggerAndWait({
        subscriptionPhaseId: phase.id,
        projectId: sub.projectId,
        now,
      })
    }

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
