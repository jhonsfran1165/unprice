import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { endTrialTask } from "../tasks/end-trial"

export const endTrialsSchedule = schedules.task({
  id: "subscription.endtrials",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (payload) => {
    const now = payload.timestamp.getTime()

    // find all subscriptions phases that are currently in trial and the trial ends at is in the past
    const subscriptions = await db.query.subscriptions.findMany({
      with: {
        phases: {
          where: (table, { eq, and, lte }) =>
            and(eq(table.status, "trialing"), lte(table.trialEndsAt, now), eq(table.active, true)),
          // phases are don't overlap, so we can use limit 1
          limit: 1,
          orderBy: (table, { desc }) => desc(table.trialEndsAt),
        },
      },
      limit: 1000,
    })

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptions) {
      const phaseId = sub.phases[0]?.id

      if (!phaseId) {
        logger.error(`Subscription ${sub.id} has no active phase`)
        continue
      }

      await endTrialTask.triggerAndWait({
        subscriptionId: sub.id,
        projectId: sub.projectId,
        now,
        phaseId,
      })
    }

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      subscriptionIds: subscriptions.map((s) => s.id),
    }
  },
})
