import { usageRecords } from "./schema"
import { entitlements } from "./schema"
import { verifications } from "./schema"

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

export type Schema = typeof schema
