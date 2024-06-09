import type { SubscriptionItem } from "@builderai/db/validators"

export type KeyHash = string
export type CacheNamespaces = {
  featureByCustomerId: SubscriptionItem
  entitlementsByCustomerId: Array<string>
  idempotentRequestUsageByHash: boolean
}

export type CacheNamespace = keyof CacheNamespaces
