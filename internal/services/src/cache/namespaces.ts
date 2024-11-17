import type {
  AggregationMethod,
  ApiKeyExtended,
  CustomerEntitlement,
  FeatureType,
} from "@unprice/db/validators"

export type EntitlementCached = {
  featureSlug: string
  featureId: string
  featureType: FeatureType
  aggregationMethod: AggregationMethod
  limit: number | null
  units: number | null
  startAt: number
  endAt: number | null
  usage: number | null
}

export type CacheNamespaces = {
  // TODO: this should containe customer information as well. Speacially for deactivating customers
  apiKeyByHash: ApiKeyExtended | null
  featureByCustomerId: Omit<CustomerEntitlement, "createdAtM" | "updatedAtM"> | null
  entitlementsByCustomerId: Array<EntitlementCached>
  idempotentRequestUsageByHash: {
    access: boolean
    message?: string
  }
}

export type CacheNamespace = keyof CacheNamespaces
