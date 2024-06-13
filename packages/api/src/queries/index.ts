import { type Database, and, eq, sql } from "@builderai/db"

import {
  features,
  planVersionFeatures,
  subscriptionItems,
  subscriptions,
  usage as usageTable,
} from "@builderai/db/schema"
import { newId } from "@builderai/db/utils"
import type { Usage } from "@builderai/db/validators"
import type { Logger } from "@builderai/logging"
import type {
  CacheNamespaces,
  CurrentUsageCached,
  SubscriptionItemCached,
} from "../pkg/cache/namespaces"
import type { Metrics } from "../pkg/metrics"

export const getCustomerFeatureQuery = async ({
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
  year?: number
  month?: number
  db: Database
  metrics: Metrics
  logger: Logger
}): Promise<SubscriptionItemCached> => {
  const start = performance.now()

  // get current month and year
  const now = new Date()
  const currentMonth = month ?? now.getMonth() + 1
  const currentYear = year ?? now.getFullYear()

  const feature = await db
    .select({
      feature: features,
      featurePlanVersion: planVersionFeatures,
      subscriptionItem: subscriptionItems,
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
    .leftJoin(
      usageTable,
      and(
        eq(subscriptionItems.id, usageTable.subscriptionItemId),
        eq(subscriptionItems.projectId, usageTable.projectId),
        eq(usageTable.month, currentMonth),
        eq(usageTable.year, currentYear)
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
            featureSlug: data.feature.slug,
            featureType: data.featurePlanVersion.featureType,
            currentUsage: data.usage
              ? {
                  limit: data.usage.limit,
                  usage: data.usage.usage,
                  month: data.usage.month,
                  year: data.usage.year,
                  updatedAt: data.usage.updatedAt.getTime(),
                }
              : null,
          }
        : null

      return response
    })
    .catch((error) => {
      logger.error("Error getting customer feature", error)
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

export const reportUsageQuery = async ({
  projectId,
  subscriptionItemId,
  db,
  metrics,
  logger,
  month,
  year,
  usage,
  limit,
}: {
  projectId: string
  subscriptionItemId: string
  year?: number
  month?: number
  db: Database
  metrics: Metrics
  logger: Logger
  usage: number
  limit?: number | null
}): Promise<CurrentUsageCached | null> => {
  const start = performance.now()

  // get current month and year
  const now = new Date()
  const currentMonth = month ?? now.getMonth() + 1
  const currentYear = year ?? now.getFullYear()

  // await db.insert(users)
  const usageData = await db
    .insert(usageTable)
    .values({
      id: newId("usage"),
      projectId: projectId,
      subscriptionItemId: subscriptionItemId,
      usage: usage,
      month: currentMonth,
      year: currentYear,
      limit: limit ?? null,
    })
    .onConflictDoUpdate({
      target: [usageTable.subscriptionItemId, usageTable.month, usageTable.year],
      set: { usage: sql`${usageTable.usage} + ${usage}` },
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
      logger.error("Error reporting usage", {
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
