import { logger, task } from "@trigger.dev/sdk/v3"
import { and, db, eq, gte, isNull, or } from "@unprice/db"
import * as schema from "@unprice/db/schema"

export const billingRecurringSubscriptionsTask = task({
  id: "billing.recurring.subscriptions",
  run: async (_payload) => {
    const now = new Date("2024-11-01T00:00:00.000Z").getTime()

    // find all those subscriptions that are active and recurring
    // and the next billing at is in the past
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
          eq(schema.subscriptions.projectId, schema.versions.projectId),
          or(
            isNull(schema.subscriptions.currentCycleEndAt),
            gte(schema.subscriptions.currentCycleEndAt, now)
          )
        )
      )
      .where(
        and(eq(schema.subscriptions.status, "active"), eq(schema.versions.planType, "recurring"))
      )

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      message: "Hello, world!",
      subscriptionIds: subscriptions.map((s) => s.subscription.id),
    }
  },
})
