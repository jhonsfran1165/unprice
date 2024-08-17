import type {
  AggregationMethod,
  ApiKeyExtended,
  FeatureType,
  Month,
  SubscriptionItem,
  Year,
} from "@unprice/db/validators"

export type CurrentUsageCached = {
  usage: number
  limit: number | null
  month: Month
  year: Year
  updatedAtM: number
}

export type SubscriptionItemCached = Omit<SubscriptionItem, "createdAtM" | "updatedAtM"> & {
  featureType: FeatureType
  aggregationMethod: AggregationMethod
}

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
  customerFeatureCurrentUsage: CurrentUsageCached | null
  featureByCustomerId: SubscriptionItemCached | null
  subscriptionsByCustomerId: Array<string>
  entitlementsByCustomerId: Array<string>
  idempotentRequestUsageByHash: boolean
}

export type CacheNamespace = keyof CacheNamespaces
