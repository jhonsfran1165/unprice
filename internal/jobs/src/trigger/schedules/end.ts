import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { expireTask } from "../.."
import { cancelTask } from "../tasks/cancel"
import { changeTask } from "../tasks/change"
import { pastDueTask } from "../tasks/pastdue"

export const endSchedule = schedules.task({
  id: "subscription.end",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    // get the subscription phases that are ending
    const subscriptionPhasesToEnd = await db.query.subscriptionPhases.findMany({
      with: {
        subscription: true,
      },
      where: (sub, { eq, and, lte, or }) =>
        and(eq(sub.active, true), eq(sub.status, "active"), or(lte(sub.endAt, now))),
    })

    for (const phase of subscriptionPhasesToEnd) {
      // if subscription not active, skip
      if (!phase.subscription.active) {
        continue
      }

      // if dates are in the past we need to take action
      const cancelAt = phase.subscription.cancelAt
      const expiresAt = phase.subscription.expiresAt
      const changeAt = phase.subscription.changeAt
      const pastDueAt = phase.subscription.pastDueAt

      if (cancelAt && cancelAt <= now) {
        await cancelTask.triggerAndWait({
          subscriptionId: phase.subscription.id,
          projectId: phase.subscription.projectId,
          now: cancelAt + 1,
          cancelAt,
          phaseId: phase.id,
        })
      } else if (expiresAt && expiresAt <= now) {
        await expireTask.triggerAndWait({
          subscriptionId: phase.subscription.id,
          projectId: phase.subscription.projectId,
          now: expiresAt + 1,
          expiresAt,
          phaseId: phase.id,
        })
      } else if (changeAt && changeAt <= now) {
        await changeTask.triggerAndWait({
          subscriptionId: phase.subscription.id,
          projectId: phase.subscription.projectId,
          now: changeAt + 1,
          changeAt: changeAt,
          phaseId: phase.id,
        })
      } else if (pastDueAt && pastDueAt <= now) {
        await pastDueTask.triggerAndWait({
          subscriptionId: phase.subscription.id,
          projectId: phase.subscription.projectId,
          now: pastDueAt + 1,
          pastDueAt: pastDueAt,
          phaseId: phase.id,
        })
      }
    }

    logger.info(`Found ${subscriptionPhasesToEnd.length} subscription phases to end`)

    return {
      subscriptionPhaseIds: subscriptionPhasesToEnd.map((s) => s.id),
    }
  },
})
