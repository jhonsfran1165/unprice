import { pgEnum } from "drizzle-orm/pg-core"

import {
  CURRENCIES,
  FEATURE_TYPES,
  PLANS_APP,
  PROJECT_TIERS_APP,
  STAGES,
  STATUS_PLAN,
  STATUS_SUBSCRIPTION,
} from "@builderai/config"

export const plans = pgEnum("plan", PLANS_APP)
export const subscriptionStatus = pgEnum(
  "subscription_status",
  STATUS_SUBSCRIPTION
)
export const projectTier = pgEnum("project_tier", PROJECT_TIERS_APP)
export const statusPlanEnum = pgEnum("status", STATUS_PLAN)
export const typeFeatureEnum = pgEnum("type", FEATURE_TYPES)
export const currencyEnum = pgEnum("currency", CURRENCIES)
export const stageEnum = pgEnum("stage", STAGES)
