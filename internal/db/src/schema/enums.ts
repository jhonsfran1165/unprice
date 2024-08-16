import { pgEnum } from "drizzle-orm/pg-core"

import {
  AGGREGATION_METHODS,
  COLLECTION_METHODS,
  CURRENCIES,
  FEATURE_TYPES,
  FEATURE_VERSION_TYPES,
  PAYMENT_PROVIDERS,
  PLANS_APP,
  PLAN_BILLING_PERIODS,
  PLAN_TYPES,
  PROJECT_TIERS_APP,
  ROLES_APP,
  STAGES,
  START_CYCLES,
  STATUS_PLAN,
  STATUS_SUBSCRIPTION,
  SUBSCRIPTION_TYPES,
  TIER_MODES,
  USAGE_MODES,
  WHEN_TO_BILLING,
} from "../utils"

// TODO: replace when we have our price engine
export const plansEnum = pgEnum("legacy_plans", PLANS_APP)
export const subscriptionStatusEnum = pgEnum("subscription_status", STATUS_SUBSCRIPTION)
export const projectTierEnum = pgEnum("project_tier", PROJECT_TIERS_APP)
export const statusPlanEnum = pgEnum("plan_version_status", STATUS_PLAN)
export const typeFeatureEnum = pgEnum("feature_types", FEATURE_TYPES)
export const typeFeatureVersionEnum = pgEnum("feature_version_types", FEATURE_VERSION_TYPES)
export const aggregationMethodEnum = pgEnum("aggregation_method", AGGREGATION_METHODS)
export const tierModeEnum = pgEnum("tier_mode", TIER_MODES)
export const usageModeEnum = pgEnum("usage_mode", USAGE_MODES)
export const paymentProviderEnum = pgEnum("payment_providers", PAYMENT_PROVIDERS)
export const currencyEnum = pgEnum("currency", CURRENCIES)
export const stageEnum = pgEnum("app_stages", STAGES)
export const teamRolesEnum = pgEnum("team_roles", ROLES_APP)
export const planBillingPeriodEnum = pgEnum("billing_period", PLAN_BILLING_PERIODS)
export const planTypeEnum = pgEnum("plan_type", PLAN_TYPES)
export const whenToBillEnum = pgEnum("when_to_bill", WHEN_TO_BILLING)
export const collectionMethodEnum = pgEnum("collection_method", COLLECTION_METHODS)
export const typeSubscriptionEnum = pgEnum("subscription_type", SUBSCRIPTION_TYPES)
export const startCycleEnum = pgEnum("start_cycle", START_CYCLES)
