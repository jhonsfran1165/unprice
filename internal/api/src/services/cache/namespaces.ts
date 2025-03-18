import type { ApiKeyExtended, CustomerEntitlement } from "@unprice/db/validators"

export type CacheNamespaces = {
  // TODO: this should containe customer information as well. Speacially for deactivating customers
  apiKeyByHash: ApiKeyExtended | null
  featureByCustomerId: CustomerEntitlement | null
  entitlementsByCustomerId: Array<CustomerEntitlement>
  idempotentRequestUsageByHash: {
    access: boolean
    message?: string
  }
}

export type CacheNamespace = keyof CacheNamespaces
