import { type Database, and, eq } from "@builderai/db"

import {
  features,
  planVersionFeatures,
  subscriptionItems,
  subscriptions,
} from "@builderai/db/schema"
import type { Logger } from "@builderai/logging"
import type { CacheNamespaces } from "../pkg/cache/namespaces"
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
}): Promise<CacheNamespaces["featureByCustomerId"]> => {
  const start = performance.now()

  const feature = await db
    .select({
      feature: features,
      featurePlan: planVersionFeatures,
      subscriptionItems: subscriptionItems,
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
    .then((res) => {
      const data = res?.[0]
      const response = data
        ? {
            id: data.subscriptionItems.id,
            projectId: data.subscriptionItems.projectId,
            subscriptionId: data.subscriptionItems.subscriptionId,
            featurePlanVersionId: data.subscriptionItems.featurePlanVersionId,
            quantity: data.subscriptionItems.quantity,
            featureSlug: data.feature.slug,
            featureType: data.featurePlan.featureType,
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
    query: "subscriptionFeatureBySlug",
    duration: end - start,
    service: "customer",
  })

  return feature
}
