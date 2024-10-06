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

export type EntitlementCached = {
  featureSlug: string
  featureId: string
  featureType: FeatureType
  aggregationMethod: AggregationMethod
  limit: number | null
  units: number | null
}

export type CacheNamespaces = {
  // TODO: this should containe customer information as well. Speacially for deactivating customers
  apiKeyByHash: ApiKeyExtended | null
  featureByCustomerId: SubscriptionItemCached | null
  entitlementsByCustomerId: Array<EntitlementCached>
  idempotentRequestUsageByHash: {
    access: boolean
    message?: string
  }
}

export type CacheNamespace = keyof CacheNamespaces
