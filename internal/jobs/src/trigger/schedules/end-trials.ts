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
    const subscriptionPhases = await db.query.subscriptionPhases.findMany({
      with: {
        subscription: true,
      },
      where: (table, { lte }) => lte(table.trialEndsAt, now),
      limit: 1000,
      orderBy: (table, { desc }) => desc(table.trialEndsAt),
    })

    // trigger the end trial task for each subscription phase
    for (const phase of subscriptionPhases) {
      const phaseId = phase.id

      if (!phaseId) {
        logger.error(`Subscription phase ${phase.subscription.id} is not active`)
        continue
      }

      await endTrialTask.triggerAndWait({
        subscriptionId: phase.subscription.id,
        projectId: phase.subscription.projectId,
        // we pass the now date as the trialEndsAt date + 1 so the tasks can validate the right date
        now: phase.trialEndsAt! + 1,
        phaseId,
      })
    }

    logger.info(`Found ${subscriptionPhases.length} subscription phases`)

    return {
      subscriptionIds: subscriptionPhases.map((s) => s.subscription.id),
    }
  },
})
