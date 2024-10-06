import { pgEnum } from "drizzle-orm/pg-core"

import {
  AGGREGATION_METHODS,
  CHANGE_TYPE,
  CHANGE_TYPE_SUBSCRIPTION_ITEM,
  COLLECTION_METHODS,
  CURRENCIES,
  FEATURE_TYPES,
  FEATURE_VERSION_TYPES,
  INVOICE_STATUS,
  INVOICE_TYPES,
  PAYMENT_PROVIDERS,
  PLAN_BILLING_PERIODS,
  PLAN_TYPES,
  ROLES_APP,
  STAGES,
  STATUS_PLAN,
  STATUS_SUBSCRIPTION,
  STATUS_SUB_CHANGES,
  TIER_MODES,
  USAGE_MODES,
  WHEN_TO_BILLING,
} from "../utils"

export const subscriptionStatusEnum = pgEnum("subscription_status", STATUS_SUBSCRIPTION)
export const invoiceStatusEnum = pgEnum("invoice_status", INVOICE_STATUS)
export const statusPlanEnum = pgEnum("plan_version_status", STATUS_PLAN)
export const typeFeatureEnum = pgEnum("feature_types", FEATURE_TYPES)
export const typeFeatureVersionEnum = pgEnum("feature_version_types", FEATURE_VERSION_TYPES)
export const aggregationMethodEnum = pgEnum("aggregation_method", AGGREGATION_METHODS)
export const tierModeEnum = pgEnum("tier_mode", TIER_MODES)
export const usageModeEnum = pgEnum("usage_mode", USAGE_MODES)
export const invoiceTypeEnum = pgEnum("invoice_type", INVOICE_TYPES)
export const paymentProviderEnum = pgEnum("payment_providers", PAYMENT_PROVIDERS)
export const statusSubChangesEnum = pgEnum("status_sub_changes", STATUS_SUB_CHANGES)
export const changeTypeEnum = pgEnum("change_type", CHANGE_TYPE)
export const changeTypeSubscriptionItemEnum = pgEnum(
  "change_type_subscription_item",
  CHANGE_TYPE_SUBSCRIPTION_ITEM
)
export const currencyEnum = pgEnum("currency", CURRENCIES)
export const stageEnum = pgEnum("app_stages", STAGES)
export const teamRolesEnum = pgEnum("team_roles", ROLES_APP)
export const planBillingPeriodEnum = pgEnum("billing_period", PLAN_BILLING_PERIODS)
export const planTypeEnum = pgEnum("plan_type", PLAN_TYPES)
export const whenToBillEnum = pgEnum("when_to_bill", WHEN_TO_BILLING)
export const collectionMethodEnum = pgEnum("collection_method", COLLECTION_METHODS)
