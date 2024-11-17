import type { Database, TransactionDatabase } from "@unprice/db"
import type { Logger } from "@unprice/logging"
import type { EntitlementCached } from "@unprice/services/cache"
import type { Metrics } from "@unprice/services/metrics"

export const getActiveEntitlementsQuery = async ({
  projectId,
  customerId,
  db,
  metrics,
  logger,
  date,
}: {
  projectId: string
  customerId: string
  db: Database | TransactionDatabase
  metrics: Metrics
  logger: Logger
  date: number
}): Promise<Array<EntitlementCached>> => {
  const start = performance.now()

  const entitlements = await db.query.customerEntitlements
    .findMany({
      with: {
        featurePlanVersion: {
          with: {
            feature: true,
          },
        },
      },
      where: (ent, { eq, and, gte, lte, isNull, or }) =>
        and(
          eq(ent.customerId, customerId),
          eq(ent.projectId, projectId),
          lte(ent.startAt, date),
          or(isNull(ent.endAt), gte(ent.endAt, date))
        ),
    })
    .catch((error) => {
      logger.error("Error getting customer entitlements", {
        error: JSON.stringify(error),
        projectId,
        customerId,
      })
      return []
    })

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.write",
    query: "reportUsageFeature",
    duration: end - start,
    service: "customer",
  })

  if (!entitlements.length) {
    return []
  }

  // get entitlements for every subscriptions, entitlements won't be repeated
  const entitlementsCustomer = entitlements.map((ent) => ({
    featureId: ent.featurePlanVersionId,
    featureSlug: ent.featurePlanVersion.feature.slug,
    featureType: ent.featurePlanVersion.featureType,
    aggregationMethod: ent.featurePlanVersion.aggregationMethod,
    limit: ent.featurePlanVersion.limit,
    units: ent.units,
    startAt: ent.startAt,
    endAt: ent.endAt,
    usage: ent.usage,
  }))

  return entitlementsCustomer
}
