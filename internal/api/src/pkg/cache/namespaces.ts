import type {
  AggregationMethod,
  ApiKeyExtended,
  FeatureType,
  SubscriptionItem,
} from "@unprice/db/validators"

export type SubscriptionItemCached = Omit<SubscriptionItem, "createdAtM" | "updatedAtM"> & {
  featureType: FeatureType
  aggregationMethod: AggregationMethod
} & {
  limit: number | null
  lastUpdatedAt: number
  currentUsage: number
  realtime: boolean
}

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
  featureByCustomerId: SubscriptionItemCached | null
  subscriptionsByCustomerId: Array<string>
  entitlementsByCustomerId: Array<string>
  idempotentRequestUsageByHash: {
    access: boolean
    message?: string
  }
}

export type CacheNamespace = keyof CacheNamespaces
