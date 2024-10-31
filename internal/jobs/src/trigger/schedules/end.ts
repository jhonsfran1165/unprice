import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { cancelTask } from "../tasks/cancel"

export const endSchedule = schedules.task({
  id: "subscription.end",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    // get the subscription ready for billing
    const subscriptionsToEnd = await db.query.subscriptions.findMany({
      with: {
        phases: {
          // get active phase now
          where: (phase, { eq, and, lte }) => and(eq(phase.active, true), lte(phase.startAt, now)),
          // phases are don't overlap, so we can use limit 1
          limit: 1,
          orderBy: (phase, { desc }) => desc(phase.startAt),
        },
      },
      where: (sub, { eq, and, lte, or }) =>
        and(
          eq(sub.active, true),
          or(lte(sub.cancelAt, now), lte(sub.expiresAt, now), lte(sub.changeAt, now))
        ),
    })

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptionsToEnd) {
      const phase = sub.phases[0]

      if (!phase) {
        throw new Error("Subscription phase not found or there is no active phase")
      }

      // if dates are in the past we need to take action

      const cancelAt = sub.cancelAt
      const expiresAt = sub.expiresAt
      const changeAt = sub.changeAt

      if (cancelAt && cancelAt <= now) {
        await cancelTask.triggerAndWait({
          subscriptionId: phase.subscriptionId,
          activePhaseId: phase.id,
          projectId: phase.projectId,
          now,
          cancelAt,
        })
      } else if (expiresAt && expiresAt <= now) {
        // await expireTask.triggerAndWait({
        //   subscriptionId: phase.subscriptionId,
        //   activePhaseId: phase.id,
        //   projectId: phase.projectId,
        //   now,
        // })
      } else if (changeAt && changeAt <= now) {
        // await changeTask.triggerAndWait({
        //   subscriptionId: phase.subscriptionId,
        //   activePhaseId: phase.id,
        //   projectId: phase.projectId,
        //   now,
        // })
      }
    }

    logger.info(`Found ${subscriptionsToEnd.length} subscriptions to end`)

    return {
      subscriptionIds: subscriptionsToEnd.map((s) => s.id),
    }
  },
})
