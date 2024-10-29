import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { cancelTask } from "../tasks/cancel"

export const cancelSchedule = schedules.task({
  id: "subscription.cancel",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    // TODO: get the current time - this is just for testing
    const now = new Date("2024-11-18T00:00:00.000Z").getTime()

    // find all subscriptions that are pending cancellation
    const subscriptionsToCancel = await db.query.subscriptions.findMany({
      where: (table, { eq, and, lte }) => and(eq(table.active, true), lte(table.cancelAt, now)),
      limit: 1000,
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
    })

    // trigger the end trial task for each subscription phase
    for (const subscription of subscriptionsToCancel) {
      if (!subscription.phases[0]?.id) {
        logger.error(`Subscription ${subscription.id} has no active phase`)
        continue
      }

      await cancelTask.triggerAndWait({
        subscriptionId: subscription.id,
        activePhaseId: subscription.phases[0].id,
        projectId: subscription.projectId,
        now,
      })
    }

    logger.info(`Found ${subscriptionsToCancel.length} subscriptions to cancel`)

    return {
      subscriptionIds: subscriptionsToCancel.map((s) => s.id),
    }
  },
})
