import type {
  ApiKeyExtended,
  Customer,
  CustomerEntitlementExtended,
  CustomerEntitlementsExtended,
  CustomerPaymentMethod,
  Feature,
  PlanVersionApi,
  Project,
  Workspace,
  getActivePhaseResponseSchema,
  getSubscriptionResponseSchema,
} from "@unprice/db/validators"
import type { z } from "zod"

export type SubscriptionPhaseCache = z.infer<typeof getActivePhaseResponseSchema>
export type SubcriptionCache = z.infer<typeof getSubscriptionResponseSchema>

export type CustomerEntitlementCache = Omit<
  CustomerEntitlementExtended,
  "createdAtM" | "updatedAtM"
>
export type CustomerEntitlementsCache = CustomerEntitlementsExtended
export type FeatureCache = Omit<Feature, "createdAtM" | "updatedAtM">
export type ProjectFeatureCache = {
  project: {
    enabled: boolean
  }
  features: FeatureCache[]
}

export type UsageEntitlementCache = {
  success: boolean
  message: string | undefined
  limit: number | undefined
  usage: number | undefined
  notifyUsage: boolean | undefined
} | null

export type CustomerCache = Customer & {
  project: Project & {
    workspace: Workspace
  }
}

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
  customerSubscription: SubcriptionCache | null
  customer: CustomerCache | null
  customerActivePhase: SubscriptionPhaseCache | null
  customerEntitlement: CustomerEntitlementCache | null
  customerEntitlements: CustomerEntitlementsCache[] | null
  customerPaymentMethods: CustomerPaymentMethod[] | null
  projectFeatures: ProjectFeatureCache | null
  idempotentRequestUsageByHash: UsageEntitlementCache | null
  planVersionList: PlanVersionApi[] | null
  planVersion: PlanVersionApi | null
}

export type CacheNamespace = keyof CacheNamespaces
