import type {
  ApiKeyExtended,
  CustomerEntitlementExtended,
  CustomerEntitlementsExtended,
  Subscription,
} from "@unprice/db/validators"

export type SubcriptionCache =
  | (Pick<
      Subscription,
      | "id"
      | "projectId"
      | "customerId"
      | "active"
      | "status"
      | "planSlug"
      | "currentCycleStartAt"
      | "currentCycleEndAt"
    > & {
      project: {
        enabled: boolean
      }
      customer: {
        active: boolean
      }
    })
  | null

export type CustomerEntitlementCache = Omit<CustomerEntitlementExtended, "createdAt" | "updatedAt">
export type CustomerEntitlementsCache = CustomerEntitlementsExtended

export type UsageEntitlementCache = {
  success: boolean
  message: string | undefined
  limit: number | undefined
  usage: number | undefined
  notifyUsage: boolean | undefined
} | null

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
  customerSubscription: SubcriptionCache | null
  customerEntitlement: CustomerEntitlementCache | null
  customerEntitlements: CustomerEntitlementsCache[] | null
  idempotentRequestUsageByHash: UsageEntitlementCache | null
}

export type CacheNamespace = keyof CacheNamespaces
