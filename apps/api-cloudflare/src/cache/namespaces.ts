import type { ApiKeyExtended } from "@unprice/db/validators"
import type { Entitlement } from "~/db/schema"

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
  customerEntitlementUsage: Pick<
    Entitlement,
    "usage" | "accumulatedUsage" | "validFrom" | "validTo" | "resetedAt" | "limit" | "featureType"
  > | null
  entitlementsByCustomerId: Array<string>
  idempotentRequestUsageByHash: {
    valid: boolean
    message?: string
  }
}

export type CacheNamespace = keyof CacheNamespaces
