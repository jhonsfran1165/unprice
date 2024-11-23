import type { Database, TransactionDatabase } from "@unprice/db"
import type { CustomerEntitlement } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"
import type { Metrics } from "@unprice/services/metrics"

export const getEntitlementsByDateQuery = async ({
  projectId,
  customerId,
  db,
  metrics,
  logger,
  now,
  includeCustom = true,
}: {
  projectId: string
  customerId: string
  db: Database | TransactionDatabase
  metrics: Metrics
  logger: Logger
  now: number
  includeCustom?: boolean
}): Promise<Array<CustomerEntitlement>> => {
  const start = performance.now()

  const entitlements = await db.query.customerEntitlements
    .findMany({
      where: (ent, { eq, and, gte, lte, isNull, or }) =>
        and(
          eq(ent.customerId, customerId),
          eq(ent.projectId, projectId),
          lte(ent.startAt, now),
          or(isNull(ent.endAt), gte(ent.endAt, now)),
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
