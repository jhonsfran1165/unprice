export const dbNameSpaces = {
  workspace: "ws",
  ingestion: "ing",
  project: "proj",
  user: "user",
  feature: "feat",
  feature_version: "fv",
  plan: "plan",
  apikey: "api",
  apikey_key: "builderai_live",
  page: "page",
  customer: "cus",
  subscription: "sub",
  domain: "dom",
  plan_version: "pv",
} as const

export const TIER_MODES_MAP = {
  volume: {
    label: "Volume",
    description: "Volume based pricing",
  },
  graduated: {
    label: "Graduated",
    description: "Graduated pricing",
  },
} as const

export const USAGE_MODES_MAP = {
  tier: {
    label: "Tier",
    description: "Volume based pricing",
  },
  package: {
    label: "Package",
    description: "Volume based pricing",
  },
  unit: {
    label: "Unit",
    description: "Volume based pricing",
  },
} as const

// TODO: change the description
export const AGGREGATION_METHODS_MAP = {
  sum: {
    label: "Sum",
    description: "Volume based pricing",
  },
  most_recent: {
    label: "Most recent",
    description: "Most recent usage",
  },
  max: {
    label: "Maximum",
    description: "Volume based pricing",
  },
  min: {
    label: "Minimum",
    description: "Volume based pricing",
  },
  count: {
    label: "Count",
    description: "Volume based pricing",
  },
} as const

export const PAYMENT_PROVIDERS = ["stripe", "lemonsqueezy"] as const
export const CURRENCIES = ["USD", "EUR"] as const
export const STAGES = ["prod", "test", "dev"] as const
export const STATUS_PLAN = ["draft", "published"] as const
export const STATUS_SUBSCRIPTION = ["active", "inactive"] as const
// TODO: delete this
export const PLANS_APP = ["FREE", "PRO", "ENTERPRISE"] as const
export const PROJECT_TIERS_APP = ["FREE", "PRO", "ENTERPRISE"] as const
export const PLAN_TYPES = ["recurring"] as const
export const PLAN_BILLING_PERIODS = ["month", "year"] as const
export const TIER_MODES = Object.keys(TIER_MODES_MAP) as unknown as readonly [
  string,
  ...string[],
]
export const USAGE_MODES = Object.keys(USAGE_MODES_MAP) as unknown as readonly [
  string,
  ...string[],
]

export const AGGREGATION_METHODS = Object.keys(
  AGGREGATION_METHODS_MAP
) as unknown as readonly [string, ...string[]]

export const ROLES_APP = ["OWNER", "ADMIN", "MEMBER"] as const
export const WHEN_TO_BILLING = ["pay_in_advance", "pay_in_arrear"] as const

export const FEATURE_TYPES_MAPS = {
  flat: {
    code: "flat",
    label: "Flat",
    description: "Single price for the feature",
  },
  tier: {
    code: "tier",
    label: "Tier",
    description: "Price per tier",
  },
  package: {
    code: "package",
    label: "Package",
    description: "Price per package of units",
  },
  unit: {
    code: "package",
    label: "Package",
    description: "Price per package of units",
  },
  usage: {
    code: "usage",
    label: "Usage",
    description: "Price per usage",
  },
} as const

// TODO: should I delete this
export const FEATURE_TYPES = Object.keys(
  FEATURE_TYPES_MAPS
) as unknown as readonly [string, ...string[]]
