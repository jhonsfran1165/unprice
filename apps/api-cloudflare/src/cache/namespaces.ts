import type { ApiKeyExtended, Subscription } from "@unprice/db/validators"
import type { Entitlement } from "~/db/types"

export type SubcriptionCache = Pick<
  Subscription,
  | "id"
  | "projectId"
  | "customerId"
  | "active"
  | "status"
  | "planSlug"
  | "currentCycleStartAt"
  | "currentCycleEndAt"
> | null

export type EntitlementCache = {
  success: boolean
  message: string | undefined
  limit: number | undefined
  usage: number | undefined
  notifyUsage: boolean | undefined
} | null

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
  customerSubscription: SubcriptionCache
  customerEntitlement: Entitlement | null
  idempotentRequestUsageByHash: EntitlementCache
}

export type CacheNamespace = keyof CacheNamespaces
