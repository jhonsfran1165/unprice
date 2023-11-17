import { pgEnum } from "drizzle-orm/pg-core"

import { PLANS_APP, PROJECT_TIERS_APP } from "@builderai/config"

export const plan = pgEnum("plan", PLANS_APP)
export const projectTier = pgEnum("project_tier", PROJECT_TIERS_APP)
