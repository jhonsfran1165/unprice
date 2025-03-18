import type { ApiKeyExtended, CustomerEntitlement } from "@unprice/db/validators"

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
  featureByCustomerId: CustomerEntitlement | null
  entitlementsByCustomerId: Array<string>
}

export type CacheNamespace = keyof CacheNamespaces
