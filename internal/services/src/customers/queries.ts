import type { Database, TransactionDatabase } from "@unprice/db"
import type { CustomerEntitlement } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"
import type { Metrics } from "@unprice/services/metrics"

// this queries are important to get some metrics
// they are performance critical
export const getEntitlementsByDateQuery = async ({
  projectId,
  customerId,
  db,
  metrics,
  logger,
  date,
  includeCustom = true,
}: {
  projectId: string
  customerId: string
  db: Database | TransactionDatabase
  metrics: Metrics
  logger: Logger
  date: number
  includeCustom?: boolean
}): Promise<Array<CustomerEntitlement>> => {
  const start = performance.now()

  const entitlements = await db.query.customerEntitlements
    .findMany({
      where: (ent, { eq, and, gte, lte, isNull, or }) =>
        and(
          eq(ent.customerId, customerId),
          eq(ent.projectId, projectId),
          lte(ent.startAt, date),
          or(isNull(ent.endAt), gte(ent.endAt, date)),
          includeCustom ? undefined : eq(ent.isCustom, false)
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
    .then((entitlements) => entitlements ?? [])

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.write",
    query: "getEntitlementsByDate",
    duration: end - start,
    service: "customer",
  })

  return entitlements
}

export const getEntitlementByDateQuery = async ({
  projectId,
  customerId,
  db,
  metrics,
  logger,
  date,
  featureSlug,
  includeCustom = true,
}: {
  projectId: string
  customerId: string
  db: Database | TransactionDatabase
  metrics: Metrics
  logger: Logger
  date: number
  featureSlug: string
  includeCustom?: boolean
}): Promise<CustomerEntitlement | null> => {
  const start = performance.now()

  const entitlement = await db.query.customerEntitlements
    .findFirst({
      where: (ent, { eq, and, gte, lte, isNull, or }) =>
        and(
          eq(ent.customerId, customerId),
          eq(ent.projectId, projectId),
          lte(ent.startAt, date),
          or(isNull(ent.endAt), gte(ent.endAt, date)),
          includeCustom ? undefined : eq(ent.isCustom, false),
          eq(ent.featureSlug, featureSlug)
        ),
    })
    .catch((error) => {
      logger.error("Error getting customer entitlements", {
        error: JSON.stringify(error),
        projectId,
        customerId,
      })

      return null
    })
    .then((entitlement) => entitlement ?? null)

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.write",
    query: "getEntitlementsByDate",
    duration: end - start,
    service: "customer",
  })

  return entitlement
}
