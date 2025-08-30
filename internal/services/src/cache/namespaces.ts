import type {
  FeatureHeatmap,
  FeaturesOverview,
  PageBrowserVisits,
  PageCountryVisits,
  PageOverview,
  PlansConversion,
  Stats,
  Usage,
  VerificationRegions,
  Verifications,
} from "@unprice/analytics"
import type {
  ApiKeyExtended,
  Customer,
  CustomerEntitlementExtended,
  CustomerPaymentMethod,
  Feature,
  PlanVersionApi,
  Project,
  Workspace,
  getActivePhaseResponseSchema,
  getSubscriptionResponseSchema,
} from "@unprice/db/validators"
import type { z } from "zod"
import type { DenyReason } from "../customers/errors"

export type SubscriptionPhaseCache = z.infer<typeof getActivePhaseResponseSchema>
export type SubcriptionCache = z.infer<typeof getSubscriptionResponseSchema>
export type ProjectFeatureCache = {
  project: {
    enabled: boolean
  }
  features: Feature[]
}

export type UsageEntitlementCache = {
  success: boolean
  message?: string
  limit?: number
  usage?: number
  notifyUsage?: boolean
  deniedReason?: DenyReason
  cacheHit?: boolean
}

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
  customerEntitlement: CustomerEntitlementExtended | null
  customerEntitlements: CustomerEntitlementExtended[] | null
  customerPaymentMethods: CustomerPaymentMethod[] | null
  projectFeatures: ProjectFeatureCache | null
  idempotentRequestUsageByHash: UsageEntitlementCache | null
  planVersionList: PlanVersionApi[] | null
  planVersion: PlanVersionApi | null
  pageCountryVisits: PageCountryVisits | null
  pageBrowserVisits: PageBrowserVisits | null
  getPagesOverview: PageOverview | null
  getFeatureHeatmap: FeatureHeatmap | null
  getFeaturesOverview: FeaturesOverview | null
  getPlansStats: Stats | null
  getPlansConversion: PlansConversion | null
  getOverviewStats: Stats | null
  getUsage: Usage | null
  getVerifications: Verifications | null
  getVerificationRegions: VerificationRegions | null
}

export type CacheNamespace = keyof CacheNamespaces
