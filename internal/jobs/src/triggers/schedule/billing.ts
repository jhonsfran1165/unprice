import { logger, task } from "@trigger.dev/sdk/v3"
import { and, db, eq, gte, isNull, or } from "@unprice/db"
import * as schema from "@unprice/db/schema"

export const billingRecurringSubscriptionsTask = task({
  id: "billing.recurring.subscriptions",
  run: async (_payload) => {
    const now = new Date().getTime()
    // find all those subscriptions that are active and recurring
    const subscriptions = await db
      .select({
        subscription: schema.subscriptions,
        planVersion: schema.versions,
      })
      .from(schema.subscriptions)
      .innerJoin(
        schema.projects,
        and(
          eq(schema.subscriptions.projectId, schema.projects.id),
          // only consider external projects
          eq(schema.projects.isInternal, false)
        )
      )
      .innerJoin(
        schema.versions,
        and(
          eq(schema.subscriptions.planVersionId, schema.versions.id),
          eq(schema.subscriptions.projectId, schema.versions.projectId),
          eq(schema.versions.planType, "recurring"),
          eq(schema.subscriptions.status, "active"),
          or(
            isNull(schema.subscriptions.lastBilledAt),
            gte(schema.subscriptions.nextBillingAt, now)
          )
        )
      )
      .where(
        and(eq(schema.subscriptions.status, "active"), eq(schema.versions.planType, "recurring"))
      )

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      message: "Hello, world!",
    }
  },
})
