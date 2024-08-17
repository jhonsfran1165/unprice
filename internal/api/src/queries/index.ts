import type { Database } from "@unprice/db"

import { getCustomerFeatureUsagePrepared, getFeatureItemBySlugPrepared } from "@unprice/db/queries"
import { usage as usageTable } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import type { Logger } from "@unprice/logging"
import type { CurrentUsageCached, SubscriptionItemCached } from "../pkg/cache/namespaces"
import type { Metrics } from "../pkg/metrics"

export const getCustomerFeatureQuery = async ({
  projectId,
  featureSlug,
  customerId,
  metrics,
  logger,
}: {
  projectId: string
  featureSlug: string
  customerId: string
  metrics: Metrics
  logger: Logger
}): Promise<SubscriptionItemCached | null> => {
  const start = performance.now()

  const feature = await getFeatureItemBySlugPrepared
    .execute({
      projectId,
      customerId,
      featureSlug,
    })
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
            aggregationMethod: data.featurePlanVersion.aggregationMethod,
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
  metrics: Metrics
  logger: Logger
}): Promise<CurrentUsageCached | null> => {
  const start = performance.now()

  const usage = await getCustomerFeatureUsagePrepared
    .execute({
      projectId,
      customerId,
      featureSlug,
      month,
      year,
    })
    .then((res) => {
      const data = res?.[0]
      const response = data?.usage
        ? {
            limit: data.usage.limit,
            usage: data.usage.usage,
            month: data.usage.month,
            year: data.usage.year,
            updatedAtM: data.usage.updatedAtM,
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
  usage,
}: {
  projectId: string
  subscriptionItemId: string
  db: Database
  metrics: Metrics
  logger: Logger
  usage: CurrentUsageCached
}): Promise<CurrentUsageCached | null> => {
  const start = performance.now()

  // update the usage in database
  const usageData = await db
    .insert(usageTable)
    .values({
      id: newId("usage"),
      projectId: projectId,
      subscriptionItemId: subscriptionItemId,
      usage: usage.usage,
      limit: usage.limit,
      updatedAtM: usage.updatedAtM,
      year: usage.year,
      month: usage.month,
    })
    .onConflictDoUpdate({
      target: [
        usageTable.projectId,
        usageTable.subscriptionItemId,
        usageTable.month,
        usageTable.year,
      ],
      set: {
        usage: usage.usage,
        limit: usage.limit,
        updatedAtM: usage.updatedAtM,
      },
    })
    .returning()
    .then((res) => {
      return res?.[0]
        ? {
            usage: res[0].usage,
            limit: res[0].limit,
            month: res[0].month,
            year: res[0].year,
            updatedAtM: res[0].updatedAtM,
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
            return [operators.desc(fields.startDateAt)]
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
