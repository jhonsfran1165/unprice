import { usageRecords } from "./schema"
import { verifications } from "./schema"

export type UsageRecord = typeof usageRecords.$inferSelect
export type NewUsageRecord = typeof usageRecords.$inferInsert
export type Verification = typeof verifications.$inferSelect
export type NewVerification = typeof verifications.$inferInsert

export const schema = {
  usageRecords,
  verifications,
}

export type Schema = typeof schema
