import { pgEnum } from "drizzle-orm/pg-core"

import {
  CURRENCIES,
  FEATURE_TYPES,
  PAYMENT_PROVIDERS,
  PLAN_BILLING_PERIODS,
  PLAN_TYPES,
  PLANS_APP,
  PROJECT_TIERS_APP,
  ROLES_APP,
  STAGES,
  STATUS_PLAN,
  STATUS_SUBSCRIPTION,
  WHEN_TO_BILLING,
} from "../utils"

// TODO: replace when we have our price engine
export const plansEnum = pgEnum("legacy_plans", PLANS_APP)
export const subscriptionStatusEnum = pgEnum(
  "subscription_status",
  STATUS_SUBSCRIPTION
)
export const projectTierEnum = pgEnum("project_tier", PROJECT_TIERS_APP)
export const statusPlanEnum = pgEnum("plan_version_status", STATUS_PLAN)
export const typeFeatureEnum = pgEnum("feature_types", FEATURE_TYPES)
export const paymentProviderEnum = pgEnum(
  "payment_providers",
  PAYMENT_PROVIDERS
)
export const currencyEnum = pgEnum("currency", CURRENCIES)
export const stageEnum = pgEnum("app_stages", STAGES)
export const teamRolesEnum = pgEnum("team_roles", ROLES_APP)
export const planBillingPeriodEnum = pgEnum(
  "billing_period",
  PLAN_BILLING_PERIODS
)
export const planTypeEnum = pgEnum("plan_type", PLAN_TYPES)
export const whenToBillEnum = pgEnum("when_to_bill", WHEN_TO_BILLING)
