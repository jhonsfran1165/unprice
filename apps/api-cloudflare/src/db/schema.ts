import type { AggregationMethod, FeatureType } from "@unprice/db/validators"
import { index, integer, numeric, sqliteTableCreator, text } from "drizzle-orm/sqlite-core"

export const version = "v1"

export const pgTableProject = sqliteTableCreator((name) => `${version}_${name}`)

export const entitlements = pgTableProject(
  "entitlements",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    customerId: text().notNull(),
    projectId: text().notNull(),
    entitlementId: text().notNull(),
    featureSlug: text().notNull(),
    // usage in the current billing cycle
    usage: numeric().default("0"),
    // accumulated usage in all time
    accumulatedUsage: numeric().default("0"),
    limit: numeric(),
    featureType: text().$type<FeatureType>().notNull(),
    aggregationMethod: text().$type<AggregationMethod>().notNull(),
    lastUsageUpdateAt: integer().notNull(),
    // days of grace period to allow the customer to use the feature after the end of the cycle
    gracePeriod: integer().notNull().default(1),
    // current billing cycle start and end dates used to revalidate and reset the usage
    startAt: integer().notNull(),
    endAt: integer().notNull(),
  },
  (table) => [
    index("customer_idx").on(table.customerId),
    index("feature_idx").on(table.featureSlug),
    index("project_idx").on(table.projectId),
    index("start_at_idx").on(table.startAt),
    index("end_at_idx").on(table.endAt),
  ]
)

export const usageRecords = pgTableProject(
  "usage_records",
  {
    // Using composite primary key of requestId and projectId for uniqueness
    id: integer().primaryKey({ autoIncrement: true }),
    entitlementId: text().notNull(),
    idempotenceKey: text().notNull(),
    requestId: text().notNull(),
    featureSlug: text().notNull(),
    customerId: text().notNull(),
    projectId: text().notNull(),
    planVersionFeatureId: text().notNull(),
    subscriptionItemId: text(),
    subscriptionPhaseId: text(),
    subscriptionId: text(),
    // time when the usage should be reported
    timestamp: integer().notNull(),
    createdAt: integer().notNull(),
    usage: numeric(),
    // TODO: add schema for metadata
    metadata: text(),
    // 0 = not deleted, 1 = deleted
    deleted: integer().notNull().default(0),
  },
  (table) => [
    // Indexes for common queries
    index("customer_idx").on(table.customerId),
    index("feature_idx").on(table.featureSlug),
    index("timestamp_idx").on(table.timestamp),
  ]
)

export const verifications = pgTableProject(
  "verifications",
  {
    // Using composite primary key of requestId and projectId for uniqueness
    id: integer().primaryKey({ autoIncrement: true }),
    requestId: text().notNull(),
    projectId: text().notNull(),
    planVersionFeatureId: text().notNull(),
    subscriptionItemId: text(),
    subscriptionPhaseId: text(),
    subscriptionId: text(),
    entitlementId: text().notNull(),
    deniedReason: text(),
    timestamp: integer().notNull(),
    createdAt: integer().notNull(),
    latency: numeric(),
    featureSlug: text().notNull(),
    customerId: text().notNull(),
    metadata: text(),
    // 0 = not deleted, 1 = deleted
    deleted: integer().notNull().default(0),
  },
  (table) => [
    // Indexes for common queries
    index("customer_idx").on(table.customerId),
    index("feature_idx").on(table.featureSlug),
    index("timestamp_idx").on(table.timestamp),
    index("request_id_idx").on(table.requestId),
    index("entitlement_idx").on(table.entitlementId),
  ]
)

export type UsageRecord = typeof usageRecords.$inferSelect
export type NewUsageRecord = typeof usageRecords.$inferInsert
export type Entitlement = typeof entitlements.$inferSelect
export type NewEntitlement = typeof entitlements.$inferInsert
export type Verification = typeof verifications.$inferSelect
export type NewVerification = typeof verifications.$inferInsert

export const schema = {
  entitlements,
  usageRecords,
  verifications,
}
