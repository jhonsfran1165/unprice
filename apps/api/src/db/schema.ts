import type { AggregationMethod, FeatureType } from "@unprice/db/validators"
import { index, integer, numeric, sqliteTableCreator, text, unique } from "drizzle-orm/sqlite-core"

export const version = "unpricedo_v1"

export const pgTableProject = sqliteTableCreator((name) => `${version}_${name}`)

export const entitlements = pgTableProject(
  "entitlements",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    entitlementId: text().notNull(),
    customerId: text().notNull(),
    projectId: text().notNull(),
    subscriptionId: text().notNull(),
    subscriptionPhaseId: text(),
    subscriptionItemId: text(),
    featurePlanVersionId: text().notNull(),
    // extra fields
    featureSlug: text().notNull(),
    featureType: text().$type<FeatureType>().notNull(),
    aggregationMethod: text().$type<AggregationMethod>().notNull(),
    // usage in the current billing cycle
    usage: numeric().notNull().default("0"),
    // accumulated usage in all time
    accumulatedUsage: numeric().notNull().default("0"),
    limit: integer(),
    lastUsageUpdateAt: integer().notNull(),
    // current billing cycle start and end dates used to revalidate and reset the usage
    validFrom: integer().notNull(),
    validTo: integer(),
    // buffer period days to allow the customer to use the feature after the end of the cycle
    bufferPeriodDays: integer().notNull().default(1),
    // resetedAt is the date when the entitlement was reseted
    // normally this is set by the subscription renew event
    resetedAt: integer().notNull(),
    metadata: text(),
    active: integer().notNull().default(1),
    realtime: integer().notNull().default(0),
    type: text().$type<"feature" | "addon">().notNull().default("feature"),
    isCustom: integer().notNull().default(0),
  },
  (table) => [
    unique("entitlements_entitlement_id_idx").on(table.entitlementId),
    index("entitlements_customer_idx").on(table.customerId),
    index("entitlements_feature_idx").on(table.featureSlug),
    index("entitlements_project_idx").on(table.projectId),
    index("entitlements_valid_from_idx").on(table.validFrom),
    index("entitlements_valid_to_idx").on(table.validTo),
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
    featurePlanVersionId: text().notNull(),
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
