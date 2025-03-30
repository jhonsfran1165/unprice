import type { Database, TransactionDatabase } from "@unprice/db"
import { customers } from "@unprice/db/schema"
import type { CustomerEntitlement } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"
import type { Metrics } from "../metrics"

// this queries are important to get some metrics
// they are performance critical
export const getEntitlementsByDateQuery = async ({
  customerId,
  db,
  metrics,
  logger,
  date,
  includeCustom = true,
}: {
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
          eq(ent.projectId, customers.projectId),
          lte(ent.validFrom, date),
          or(isNull(ent.validTo), gte(ent.validTo, date)),
          includeCustom ? undefined : eq(ent.isCustom, false)
        ),
    })
    .catch((error) => {
      logger.error("Error getting customer entitlements", {
        error: JSON.stringify(error),
        customerId,
      })

      return []
    })
    .then((entitlements) => entitlements ?? [])

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.read",
    query: "getEntitlementsByDate",
    duration: end - start,
    service: "customer",
    customerId,
  })

  return entitlements
}

export const getEntitlementByDateQuery = async ({
  customerId,
  db,
  metrics,
  logger,
  date,
  featureSlug,
  includeCustom = true,
}: {
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
      with: {
        project: {
          columns: {
            id: true,
            workspaceId: true,
          },
        },
        subscriptionItem: {
          columns: {
            id: true,
          },
          with: {
            subscriptionPhase: {
              columns: {
                id: true,
              },
              with: {
                subscription: {
                  columns: {
                    id: true,
                    currentCycleStartAt: true,
                    currentCycleEndAt: true,
                  },
                },
              },
            },
          },
        },
      },
      where: (ent, { eq, and, gte, lte, isNull, or }) =>
        and(
          eq(ent.customerId, customerId),
          eq(ent.projectId, customers.projectId),
          lte(ent.validFrom, date),
          or(isNull(ent.validTo), gte(ent.validTo, date)),
          includeCustom ? undefined : eq(ent.isCustom, false)
        ),
    })
    .catch((error) => {
      logger.error("Error getting customer entitlements", {
        error: JSON.stringify(error),
        customerId,
      })

      return null
    })
    .then((entitlement) => entitlement ?? null)

  const end = performance.now()

  metrics.emit({
    metric: "metric.db.read",
    query: "getEntitlementByDate",
    duration: end - start,
    service: "customer",
    customerId,
    featureSlug,
  })

  return entitlement
}
