import { index, integer, numeric, sqliteTableCreator, text } from "drizzle-orm/sqlite-core"

export const version = "unpricedo_v1"

export const pgTableProject = sqliteTableCreator((name) => `${version}_${name}`)

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
    featurePlanVersionId: text().notNull(),
    subscriptionItemId: text(),
    subscriptionPhaseId: text(),
    subscriptionId: text(),
    // time when the usage should be reported
    timestamp: integer().notNull(),
    createdAt: integer().notNull(),
    usage: numeric(),
    metadata: text(),
    // 0 = not deleted, 1 = deleted
    deleted: integer().notNull().default(0),
  },
  (table) => [
    // Indexes for common queries
    index("usage_records_customer_idx").on(table.customerId),
    index("usage_records_feature_idx").on(table.featureSlug),
    index("usage_records_timestamp_idx").on(table.timestamp),
  ]
)

export const verifications = pgTableProject(
  "verifications",
  {
    // Using composite primary key of requestId and projectId for uniqueness
    id: integer().primaryKey({ autoIncrement: true }),
    requestId: text().notNull(),
    projectId: text().notNull(),
    featurePlanVersionId: text().notNull(),
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
    success: integer().notNull().default(0),
  },
  (table) => [
    // Indexes for common queries
    index("verifications_customer_idx").on(table.customerId),
    index("verifications_feature_idx").on(table.featureSlug),
    index("verifications_timestamp_idx").on(table.timestamp),
    index("verifications_request_id_idx").on(table.requestId),
    index("verifications_entitlement_idx").on(table.entitlementId),
  ]
)
