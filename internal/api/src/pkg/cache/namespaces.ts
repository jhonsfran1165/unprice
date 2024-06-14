import type { FeatureType, Month, SubscriptionItem, Year } from "@builderai/db/validators"

export type CurrentUsageCached = {
  usage: number
  limit: number | null
  month: Month
  year: Year
  updatedAt: number
} | null

export type SubscriptionItemCached =
  | (Omit<SubscriptionItem, "createdAt" | "updatedAt"> & {
      featureType: FeatureType
    })
  | null

export type CacheNamespaces = {
  customerFeatureCurrentUsage: CurrentUsageCached
  featureByCustomerId: SubscriptionItemCached
  subscriptionsByCustomerId: Array<string>
  entitlementsByCustomerId: Array<string>
  idempotentRequestUsageByHash: boolean
}

export type CacheNamespace = keyof CacheNamespaces
