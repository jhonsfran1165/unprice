import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "../db"
import { endTrialTask } from "../tasks/end-trial"

export const endTrialsSchedule = schedules.task({
  id: "subscription.endtrials",
  // every 12 hours (UTC timezone)
  // if dev then every 1 minute in dev mode
  cron: process.env.NODE_ENV === "development" ? "*/1 * * * *" : "0 */12 * * *",
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
      const subscription = phase.subscription

      if (!["ending_trial", "trialing"].includes(subscription.status)) {
        logger.error(`Subscription ${subscription.id} is not trialing, skipping`)
        continue
      }

      const phaseId = phase.id

      await endTrialTask.triggerAndWait({
        subscriptionId: phase.subscription.id,
        projectId: phase.subscription.projectId,
        now,
        phaseId,
      })
    }

    logger.info(`Found ${subscriptionPhases.length} subscription phases`)

    return {
      subscriptionIds: subscriptionPhases.map((s) => s.subscription.id),
    }
  },
})
