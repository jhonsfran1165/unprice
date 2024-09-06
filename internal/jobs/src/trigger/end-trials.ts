import { logger, schedules } from "@trigger.dev/sdk/v3"
import { and, db, eq, gte, isNotNull, or } from "@unprice/db"
import * as schema from "@unprice/db/schema"

export const endTrialsTask = schedules.task({
  id: "billing.end.trials",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    const now = new Date("2024-11-01T00:00:00.000Z").getTime()

    // the Idea here is to change the status of the subscription once they are no longer in trial
    // and depending on the planConfiguration, we either downgrade the plan or cancel the subscription

    // TODO: handle this properly
    // find all those subscriptions that are currently in trial and the trial ends at is in the past
    const subscriptions = await db
      .select({
        subscription: schema.subscriptions,
        planVersion: schema.versions,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.projects, and(eq(schema.subscriptions.projectId, schema.projects.id)))
      .innerJoin(
        schema.versions,
        and(
          eq(schema.subscriptions.planVersionId, schema.versions.id),
          eq(schema.subscriptions.projectId, schema.versions.projectId)
        )
      )
      .where(
        and(
          eq(schema.versions.planType, "recurring"),
          or(
            isNotNull(schema.subscriptions.trialEndsAt),
            gte(schema.subscriptions.trialEndsAt, now)
          )
        )
      )

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      message: "Hello, world!",
      subscriptionIds: subscriptions.map((s) => s.subscription.id),
    }
  },
})
