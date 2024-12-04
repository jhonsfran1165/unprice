import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { expireTask } from "../.."
import { cancelTask } from "../tasks/cancel"
import { changeTask } from "../tasks/change"

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
      where: (sub, { eq, and, lte, or }) =>
        and(
          eq(sub.active, true),
          or(lte(sub.cancelAt, now), lte(sub.expiresAt, now), lte(sub.changeAt, now))
        ),
    })

    // trigger the end trial task for each subscription phase
    // TODO: re check this logic
    for (const sub of subscriptionsToEnd) {
      // if dates are in the past we need to take action

      const cancelAt = sub.cancelAt
      const expiresAt = sub.expiresAt
      const changeAt = sub.changeAt

      if (cancelAt && cancelAt <= now) {
        await cancelTask.triggerAndWait({
          subscriptionId: sub.id,
          projectId: sub.projectId,
          now,
          cancelAt,
        })
      } else if (expiresAt && expiresAt <= now) {
        await expireTask.triggerAndWait({
          subscriptionId: sub.id,
          projectId: sub.projectId,
          now,
          expiresAt,
        })
      } else if (changeAt && changeAt <= now) {
        await changeTask.triggerAndWait({
          subscriptionId: sub.id,
          projectId: sub.projectId,
          now,
          changeAt: changeAt,
        })
      }
    }

    logger.info(`Found ${subscriptionsToEnd.length} subscriptions to end`)

    return {
      subscriptionIds: subscriptionsToEnd.map((s) => s.id),
    }
  },
})
