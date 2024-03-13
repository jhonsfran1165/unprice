export const dbNameSpaces = {
  workspace: "ws",
  ingestion: "ingest",
  project: "proj",
  user: "user",
  feature: "feat",
  plan: "plan",
  canva: "canva",
  apikey: "api",
  apikey_key: "builderai_live",
  page: "page",
  customer: "customer",
  subscription: "sub",
  domain: "domain",
  plan_version: "pv",
} as const

// Use custom alphabet without special chars for less chaotic, copy-able URLs
// Will not collide for a long long time: https://zelark.github.io/nano-id-cc/
export const customAlphabet =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" as const

export const TIER_MODES_MAP = {
  sum: {
    label: "Sum of usage during the period",
    description: "Volume based pricing",
  },
  most_recent: {
    label: "Most recent usage during the period",
    description: "Volume based pricing",
  },
  max: {
    label: "Maximum usage during the period",
    description: "Volume based pricing",
  },
} as const

export const FEATURE_TYPES = ["flat", "tiered", "volume"] as const
export const CURRENCIES = ["USD", "EUR", "GBP"] as const
export const STAGES = ["prod", "test", "dev"] as const
export const STATUS_PLAN = ["draft", "published", "archived"] as const
export const STATUS_SUBSCRIPTION = ["active", "inactive"] as const
export const PLANS_APP = ["FREE", "PRO", "ENTERPRISE"] as const
export const PROJECT_TIERS_APP = ["FREE", "PRO", "ENTERPRISE"] as const

export const TIER_MODES = Object.keys(TIER_MODES_MAP) as unknown as readonly [
  string,
  ...string[],
]

export const ROLES_APP = ["OWNER", "ADMIN", "MEMBER"] as const
