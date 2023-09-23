import { pgEnum } from "drizzle-orm/pg-core"

import { PLANS, PROJECT_TIER } from "@builderai/config"

const PLANS_APP = Object.keys(PLANS) as unknown as readonly [
  string,
  ...string[],
]

const PROJECT_TIERS_APP = Object.keys(PROJECT_TIER) as unknown as readonly [
  string,
  ...string[],
]

export const plan = pgEnum("plan", PLANS_APP)
export const projectTier = pgEnum("project_tier", PROJECT_TIERS_APP)
