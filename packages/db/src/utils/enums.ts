import { pgEnum } from "drizzle-orm/pg-core"

import { PLANS_APP, PROJECT_TIERS_APP } from "@builderai/config"

export const FEATURE_TYPES = ["flat", "metered", "hybrid"] as const
export const CURRENCIES = ["USD", "EUR", "GBP"] as const
export const STAGES = ["prod", "test", "dev"] as const
export const STATUS_PLAN = ["draft", "published", "archived"] as const
export const STATUS_SUBSCRIPTION = ["active", "inactive"] as const

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
