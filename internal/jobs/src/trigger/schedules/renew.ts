import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { renewTask } from "../tasks/renew"

export const renewSchedule = schedules.task({
  id: "subscriptionPhase.renew",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    // get the subscription ready for renewal
    const subscriptions = await db.query.subscriptions.findMany({
      with: {
        phases: {
          // get active phase now
          where: (phase, { eq, and, gte, lte, isNull, or }) =>
            and(
              eq(phase.active, true),
              lte(phase.startAt, now),
              // only auto renewing phases are eligible for renewal
              eq(phase.autoRenew, true),
              or(isNull(phase.endAt), gte(phase.endAt, now))
            ),
          // phases are don't overlap, so we can use limit 1
          limit: 1,
        },
      },
      where: (sub, { eq, and, lte }) => and(eq(sub.active, true), lte(sub.currentCycleEndAt, now)),
    })

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptions) {
      const phase = sub.phases[0]

      if (!phase) {
        throw new Error("Subscription phase not found or there is no active phase")
      }
      await renewTask.triggerAndWait({
        subscriptionId: sub.id,
        activePhaseId: phase.id,
        projectId: phase.projectId,
        now,
      })
    }

    logger.info(`Found ${subscriptions.length} subscriptions for renewal`)

    return {
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
