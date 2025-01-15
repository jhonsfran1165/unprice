import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { renewTask } from "../tasks"

export const renewSchedule = schedules.task({
  id: "subscriptionPhase.renew",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    const subscriptions = await db.query.subscriptions.findMany({
      with: {
        phases: {
          where: (phase, { eq, and, inArray }) =>
            and(
              eq(phase.active, true),
              inArray(phase.status, ["active", "trial_ended"]),
              eq(phase.autoRenew, true)
            ),
          orderBy: (phase, { asc }) => [asc(phase.startAt)],
        },
      },
      where: (sub, { eq, and, lte }) => and(eq(sub.active, true), lte(sub.renewAt, now)),
    })

    logger.info(`Found ${subscriptions.length} subscriptions for invoicing`)

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptions) {
      // get the first active phase
      const phase = sub.phases[0]!

      await renewTask.triggerAndWait({
        subscriptionId: sub.id,
        projectId: sub.projectId,
        now: sub.nextInvoiceAt + 1,
        phaseId: phase.id,
      })
    }

    return {
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
