import { pgEnum } from "drizzle-orm/pg-core"

import { PLANS_APP, PROJECT_TIERS_APP } from "@builderai/config"

export const plans = pgEnum("plan", PLANS_APP)
export const projectTier = pgEnum("project_tier", PROJECT_TIERS_APP)

export const typeFeatureEnum = pgEnum("type", ["flat", "metered", "hybrid"])
export const currencyEnum = pgEnum("currency", ["USD", "EUR", "GBP"])
export const stageEnum = pgEnum("stage", ["prod", "test", "dev"])
