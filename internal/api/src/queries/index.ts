import { type Database, and, eq, getTableColumns, sql } from "@builderai/db"

import {
  features,
  planVersionFeatures,
  subscriptionItems,
  subscriptions,
  usage as usageTable,
} from "@builderai/db/schema"
import { newId } from "@builderai/db/utils"
import type { Logger } from "@builderai/logging"
import type { CurrentUsageCached, SubscriptionItemCached } from "../pkg/cache/namespaces"
import type { Metrics } from "../pkg/metrics"

export const getCustomerFeatureQuery = async ({
  projectId,
  featureSlug,
  customerId,
  db,
  metrics,
  logger,
}: {
  projectId: string
  featureSlug: string
  customerId: string
  db: Database
  metrics: Metrics
  logger: Logger
}): Promise<SubscriptionItemCached | null> => {
  const start = performance.now()

  const feature = await db
    .select({
      feature: features,
      featurePlanVersion: planVersionFeatures,
      subscriptionItem: subscriptionItems,
    })
    .from(subscriptions)
    .innerJoin(
      subscriptionItems,
      and(
        eq(subscriptions.id, subscriptionItems.subscriptionId),
        eq(subscriptions.projectId, subscriptionItems.projectId)
      )
    )
    .innerJoin(
      planVersionFeatures,
      and(
        eq(subscriptionItems.featurePlanVersionId, planVersionFeatures.id),
        eq(subscriptionItems.projectId, planVersionFeatures.projectId)
      )
    )
    .innerJoin(
      features,
      and(
        eq(planVersionFeatures.featureId, features.id),
        eq(planVersionFeatures.projectId, features.projectId),
        eq(features.slug, featureSlug)
      )
    )
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.projectId, projectId)
      )
    )
    .limit(1)
    .then((res) => {
      const data = res?.[0]
      const response = data
        ? {
            id: data.subscriptionItem.id,
            projectId: data.subscriptionItem.projectId,
            subscriptionId: data.subscriptionItem.subscriptionId,
            featurePlanVersionId: data.subscriptionItem.featurePlanVersionId,
            units: data.subscriptionItem.units,
            featureType: data.featurePlanVersion.featureType,
          }
        : null

      return response
    })
    .catch((error) => {
      logger.error("Error getting customer feature", {
        error: JSON.stringify(error),
        projectId,
        featureSlug,
      })

      return null
    })

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.read",
    query: "customerFeatureBySlug",
    duration: end - start,
    service: "customer",
  })

  return feature
}

export const getCustomerFeatureUsageQuery = async ({
  projectId,
  featureSlug,
  customerId,
  db,
  metrics,
  logger,
  month,
  year,
}: {
  projectId: string
  featureSlug: string
  customerId: string
  year: number
  month: number
  db: Database
  metrics: Metrics
  logger: Logger
}): Promise<CurrentUsageCached | null> => {
  const start = performance.now()

  const usage = await db
    .select({
      usage: usageTable,
    })
    .from(subscriptions)
    .innerJoin(
      subscriptionItems,
      and(
        eq(subscriptions.id, subscriptionItems.subscriptionId),
        eq(subscriptions.projectId, subscriptionItems.projectId)
      )
    )
    .innerJoin(
      planVersionFeatures,
      and(
        eq(subscriptionItems.featurePlanVersionId, planVersionFeatures.id),
        eq(subscriptionItems.projectId, planVersionFeatures.projectId)
      )
    )
    .innerJoin(
      features,
      and(
        eq(planVersionFeatures.featureId, features.id),
        eq(planVersionFeatures.projectId, features.projectId),
        eq(features.slug, featureSlug)
      )
    )
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.projectId, projectId)
      )
    )
    .innerJoin(
      usageTable,
      and(
        eq(subscriptionItems.id, usageTable.subscriptionItemId),
        eq(subscriptionItems.projectId, usageTable.projectId),
        eq(usageTable.month, month),
        eq(usageTable.year, year)
      )
    )
    .limit(1)
    .then((res) => {
      const data = res?.[0]
      const response = data?.usage
        ? {
            limit: data.usage.limit,
            usage: data.usage.usage,
            month: data.usage.month,
            year: data.usage.year,
            updatedAt: data.usage.updatedAt.getTime(),
          }
        : null

      return response
    })
    .catch((error) => {
      logger.error("Error in getCustomerFeatureUsageQuery", {
        error: JSON.stringify(error),
        projectId,
        featureSlug,
      })

      return null
    })

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.read",
    query: "customerFeatureUsage",
    duration: end - start,
    service: "customer",
  })

  return usage
}

export const reportUsageQuery = async ({
  projectId,
  subscriptionItemId,
  db,
  metrics,
  logger,
  month,
  year,
  usage,
}: {
  projectId: string
  subscriptionItemId: string
  year: number
  month: number
  db: Database
  metrics: Metrics
  logger: Logger
  usage: number
}): Promise<CurrentUsageCached | null> => {
  const start = performance.now()

  // update the usage in database
  const usageData = await db
    .update(usageTable)
    .set({
      usage: sql`${usageTable.usage} + ${usage}`,
    })
    .where(
      and(
        eq(usageTable.projectId, projectId),
        eq(usageTable.subscriptionItemId, subscriptionItemId),
        eq(usageTable.month, month),
        eq(usageTable.year, year)
      )
    )
    .returning()
    .then((res) => {
      return res?.[0]
        ? {
            usage: res[0].usage,
            limit: res[0].limit,
            month: res[0].month,
            year: res[0].year,
            updatedAt: res[0].updatedAt.getTime(),
          }
        : null
    })
    .catch((error) => {
      logger.error("Error reporting usage to the database reportUsageQuery", {
        error: JSON.stringify(error),
        projectId,
        subscriptionItemId,
        usage,
      })
      return null
    })

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.write",
    query: "reportUsageFeature",
    duration: end - start,
    service: "customer",
  })

  return usageData
}

export const createUsageQuery = async ({
  projectId,
  customerId,
  featureSlug,
  db,
  metrics,
  logger,
  month,
  year,
}: {
  projectId: string
  customerId: string
  featureSlug: string
  year: number
  month: number
  db: Database
  metrics: Metrics
  logger: Logger
}): Promise<CurrentUsageCached | null> => {
  const start = performance.now()

  const { limit } = getTableColumns(planVersionFeatures)
  const { id } = getTableColumns(subscriptionItems)

  // get the feature
  const feature = await db
    .select({
      featurePlanVersion: {
        limit,
      },
      subscriptionItem: {
        id,
      },
    })
    .from(subscriptions)
    .innerJoin(
      subscriptionItems,
      and(
        eq(subscriptions.id, subscriptionItems.subscriptionId),
        eq(subscriptions.projectId, subscriptionItems.projectId)
      )
    )
    .innerJoin(
      planVersionFeatures,
      and(
        eq(subscriptionItems.featurePlanVersionId, planVersionFeatures.id),
        eq(subscriptionItems.projectId, planVersionFeatures.projectId)
      )
    )
    .innerJoin(
      features,
      and(
        eq(planVersionFeatures.featureId, features.id),
        eq(planVersionFeatures.projectId, features.projectId),
        eq(features.slug, featureSlug)
      )
    )
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.projectId, projectId)
      )
    )
    .limit(1)
    .then((res) => res?.[0] ?? null)
    .catch((error) => {
      logger.error("Error in createUsageQuery", {
        error: JSON.stringify(error),
        projectId,
        featureSlug,
      })

      return null
    })

  if (!feature) {
    logger.error("Error in createUsageQuery", {
      error: "Feature not found",
      projectId,
      featureSlug,
    })
    return null
  }

  // await db.insert(users)
  const usageData = await db
    .insert(usageTable)
    .values({
      id: newId("usage"),
      projectId: projectId,
      subscriptionItemId: feature.subscriptionItem.id,
      usage: 0,
      month: month,
      year: year,
      limit: feature.featurePlanVersion.limit,
    })
    .returning()
    .then((res) => {
      return res?.[0]
        ? {
            usage: res[0].usage,
            limit: res[0].limit,
            month: res[0].month,
            year: res[0].year,
            updatedAt: res[0].updatedAt.getTime(),
          }
        : null
    })
    .catch((error) => {
      logger.error("Error reporting usage to the database createUsageQuery", {
        error: JSON.stringify(error),
        projectId,
      })
      return null
    })

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.write",
    query: "createUsageFeature",
    duration: end - start,
    service: "customer",
  })

  return usageData
}

export const getEntitlementsQuery = async ({
  projectId,
  customerId,
  db,
  metrics,
  logger,
}: {
  projectId: string
  customerId: string
  db: Database
  metrics: Metrics
  logger: Logger
}): Promise<Array<string>> => {
  const start = performance.now()

  const customer = await db.query.customers
    .findFirst({
      with: {
        subscriptions: {
          columns: {
            id: true,
          },
          where: (sub, { eq }) => eq(sub.status, "active"),
          orderBy(fields, operators) {
            return [operators.desc(fields.startDate)]
          },
          with: {
            planVersion: {
              columns: {
                id: true,
              },
              with: {
                planFeatures: {
                  columns: {
                    id: true,
                  },
                  with: {
                    feature: {
                      columns: {
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: (customer, { eq, and }) =>
        and(eq(customer.id, customerId), eq(customer.projectId, projectId)),
    })
    .catch((error) => {
      logger.error("Error getting customer entitlements", {
        error: JSON.stringify(error),
        projectId,
        customerId,
      })
      return null
    })

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.write",
    query: "reportUsageFeature",
    duration: end - start,
    service: "customer",
  })

  if (!customer || !customer?.subscriptions) {
    return []
  }

  if (!customer.subscriptions || customer.subscriptions.length === 0) {
    return []
  }

  // get entitlements for every subscriptions, entitlements won't be repeated
  const entitlements = Array.from(
    new Set(
      customer.subscriptions.flatMap((sub) =>
        sub.planVersion.planFeatures.map((pf) => pf.feature.slug)
      )
    )
  )

  return entitlements
}
