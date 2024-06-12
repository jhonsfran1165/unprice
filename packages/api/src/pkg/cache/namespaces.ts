import type { SubscriptionItem } from "@builderai/db/validators"

export type KeyHash = string
export type CacheNamespaces = {
  featureByCustomerId:
    | (Omit<SubscriptionItem, "createdAt" | "updatedAt"> & {
        featureType: string
        featureSlug: string
      })
    | null
  subscriptionsByCustomerId: Array<string>
  entitlementsByCustomerId: Array<string>
  idempotentRequestUsageByHash: boolean
}

export type CacheNamespace = keyof CacheNamespaces
