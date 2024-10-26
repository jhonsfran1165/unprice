import { logger, schedules } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { endTrialTask } from "../tasks/end-trial"

export const endTrialsTask = schedules.task({
  id: "subscriptionPhase.endtrials",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    // TODO: get the current time - this is just for testing
    const now = new Date("2024-11-18T00:00:00.000Z").getTime()

    // find all subscriptions phases that are currently in trial and the trial ends at is in the past
    const subscriptionPhases = await db.query.subscriptionPhases.findMany({
      where: (table, { eq, and, lte }) =>
        and(eq(table.status, "trialing"), lte(table.trialEndsAt, now), eq(table.active, true)),
      limit: 1000,
    })

    // trigger the end trial task for each subscription phase
    for (const sub of subscriptionPhases) {
      await endTrialTask.triggerAndWait({
        subscriptionPhaseId: sub.id,
        projectId: sub.projectId,
        now,
      })
    }

    logger.info(`Found ${subscriptionPhases.length} subscription phases`)

    return {
      subscriptionPhaseIds: subscriptionPhases.map((s) => s.id),
    }
  },
})
