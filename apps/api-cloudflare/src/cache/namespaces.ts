import type { ApiKeyExtended, FeatureType } from "@unprice/db/validators"

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
  customerEntitlementUsage: {
    usage: number
    accumulatedUsage: number
    validFrom: number
    validTo: number
    resetedAt: number
    limit: number
    featureType: FeatureType
  } | null
  entitlementsByCustomerId: Array<string>
  idempotentRequestUsageByHash: {
    valid: boolean
    message?: string
  }
}

export type CacheNamespace = keyof CacheNamespaces
