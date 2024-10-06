import type { Database, TransactionDatabase } from "@unprice/db"

import { getFeatureItemBySlugPrepared } from "@unprice/db/queries"
import type { Logger } from "@unprice/logging"
import type { EntitlementCached, SubscriptionItemCached } from "@unprice/services/cache"
import type { Metrics } from "@unprice/services/metrics"
import type { Analytics } from "@unprice/tinybird"

export const getCustomerFeatureQuery = async ({
  projectId,
  featureSlug,
  customerId,
  month,
  year,
  metrics,
  logger,
  analytics,
}: {
  projectId: string
  featureSlug: string
  customerId: string
  month: number
  year: number
  metrics: Metrics
  logger: Logger
  analytics: Analytics
}): Promise<SubscriptionItemCached | null> => {
  const start = performance.now()

  const feature = await getFeatureItemBySlugPrepared
    .execute({
      projectId,
      customerId,
      featureSlug,
    })
    .then(async (res) => {
      const data = res?.[0]

      if (!data) {
        return null
      }

      // get the current usage
      const usageData = await analytics
        .getTotalUsagePerFeature({
          customerId,
          featureSlug,
          projectId,
          // TODO: better to query by month and year instead? so customers can report usage for previous months??
          start: new Date(year, month - 1, 1).getTime(),
          end: new Date(year, month).getTime(),
        })
        .then((usage) => usage.data[0])

      // this will be the usage of the feature for the period
      const usage = usageData ? usageData[data.featurePlanVersion.aggregationMethod] || 0 : 0

      const response = {
        id: data.subscriptionItem.id,
        projectId: data.subscriptionItem.projectId,
        subscriptionPhaseId: data.subscriptionItem.subscriptionPhaseId,
        featurePlanVersionId: data.subscriptionItem.featurePlanVersionId,
        units: data.subscriptionItem.units,
        featureType: data.featurePlanVersion.featureType,
        aggregationMethod: data.featurePlanVersion.aggregationMethod,
        limit: data.featurePlanVersion.limit,
        currentUsage: usage,
        realtime: !!data.featurePlanVersion.metadata?.realtime,
        lastUpdatedAt: Date.now(),
        isUsage: data.subscriptionItem.isUsage,
      }

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

export const getEntitlementsQuery = async ({
  projectId,
  customerId,
  db,
  metrics,
  logger,
}: {
  projectId: string
  customerId: string
  db: Database | TransactionDatabase
  metrics: Metrics
  logger: Logger
}): Promise<Array<EntitlementCached>> => {
  const start = performance.now()

  const customer = await db.query.customers
    .findFirst({
      with: {
        subscriptions: {
          columns: {
            id: true,
          },
          // subscriptions that are active, which means endAt is in the past or undefined
          where: (sub, { eq }) => eq(sub.active, true),
          orderBy(fields, operators) {
            return [operators.desc(fields.createdAtM)]
          },
          with: {
            phases: {
              // get active phase now
              where: (phase, { eq, and, gte, lte }) =>
                and(
                  eq(phase.status, "active"),
                  gte(phase.startAt, Date.now()),
                  lte(phase.endAt, Date.now())
                ),
              // phases are don't overlap, so we can use limit 1
              limit: 1,
              with: {
                items: {
                  with: {
                    featurePlanVersion: {
                      with: {
                        feature: true,
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
  const entitlements = customer.subscriptions.flatMap((sub) =>
    sub.phases.flatMap((phase) =>
      phase.items.map((item) => ({
        featureId: item.featurePlanVersionId,
        featureSlug: item.featurePlanVersion.feature.slug,
        featureType: item.featurePlanVersion.featureType,
        aggregationMethod: item.featurePlanVersion.aggregationMethod,
        limit: item.featurePlanVersion.limit,
        units: item.units,
      }))
    )
  )

  return entitlements
}
