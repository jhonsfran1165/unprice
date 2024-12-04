import { pgEnum } from "drizzle-orm/pg-core"

import {
  AGGREGATION_METHODS,
  COLLECTION_METHODS,
  CURRENCIES,
  DUE_BEHAVIOUR,
  FEATURE_TYPES,
  FEATURE_VERSION_TYPES,
  INVOICE_STATUS,
  INVOICE_TYPE,
  PAYMENT_PROVIDERS,
  PLAN_BILLING_PERIODS,
  PLAN_TYPES,
  ROLES_APP,
  STAGES,
  STATUS_PHASE,
  STATUS_PLAN,
  TIER_MODES,
  USAGE_MODES,
  WHEN_TO_BILLING,
} from "../utils"

export const phaseStatusEnum = pgEnum("phase_status", STATUS_PHASE)
export const invoiceStatusEnum = pgEnum("invoice_status", INVOICE_STATUS)
export const invoiceTypeEnum = pgEnum("invoice_type", INVOICE_TYPE)
export const statusPlanEnum = pgEnum("plan_version_status", STATUS_PLAN)
export const typeFeatureEnum = pgEnum("feature_types", FEATURE_TYPES)
export const typeFeatureVersionEnum = pgEnum("feature_version_types", FEATURE_VERSION_TYPES)
export const aggregationMethodEnum = pgEnum("aggregation_method", AGGREGATION_METHODS)
export const tierModeEnum = pgEnum("tier_mode", TIER_MODES)
export const usageModeEnum = pgEnum("usage_mode", USAGE_MODES)
export const paymentProviderEnum = pgEnum("payment_providers", PAYMENT_PROVIDERS)
export const dueBehaviourEnum = pgEnum("due_behaviour", DUE_BEHAVIOUR)
export const currencyEnum = pgEnum("currency", CURRENCIES)
export const stageEnum = pgEnum("app_stages", STAGES)
export const teamRolesEnum = pgEnum("team_roles", ROLES_APP)
export const billingPeriodEnum = pgEnum("billing_period", PLAN_BILLING_PERIODS)
export const planTypeEnum = pgEnum("plan_type", PLAN_TYPES)
export const whenToBillEnum = pgEnum("when_to_bill", WHEN_TO_BILLING)
export const collectionMethodEnum = pgEnum("collection_method", COLLECTION_METHODS)
