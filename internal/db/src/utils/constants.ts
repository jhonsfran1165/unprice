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

export const FEATURE_TYPES_MAPS = {
  flat: {
    code: "flat",
    label: "Flat",
    description: "Single price per unit",
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
  usage: {
    code: "usage",
    label: "Usage",
    description: "Price per usage",
  },
} as const

export const USAGE_MODES_MAP = {
  tier: {
    code: "tier",
    label: "Tier",
    description: "Volume based pricing",
  },
  package: {
    code: "package",
    label: "Package",
    description: "Volume based pricing",
  },
  unit: {
    code: "unit",
    label: "Unit",
    description: "Volume based pricing",
  },
} as const

export const AGGREGATION_METHODS_MAP = {
  sum: {
    label: "Sum",
    description: "Adds up all events values within a time period",
  },
  last_during_period: {
    label: "Last during period",
    description: "Last event value during a time period",
  },
  count: {
    label: "Count",
    description: "Counts the number of events within a time period",
  },
  max: {
    label: "Maximum",
    description: "Maximum event value within a time period",
  },
} as const

export type AggregationMethod = keyof typeof AGGREGATION_METHODS_MAP
export type TierMode = keyof typeof TIER_MODES_MAP
export type UsageMode = keyof typeof USAGE_MODES_MAP
export type FeatureType = keyof typeof FEATURE_TYPES_MAPS

export const PAYMENT_PROVIDERS = ["stripe", "lemonsqueezy"] as const
export const CURRENCIES = ["USD", "EUR"] as const
export const STAGES = ["prod", "test", "dev"] as const
export const STATUS_PLAN = ["draft", "published"] as const
export const STATUS_SUBSCRIPTION = ["canceled", "active", "inactive", "paused"] as const
// TODO: delete this
export const PLANS_APP = ["FREE", "PRO", "ENTERPRISE"] as const
export const PROJECT_TIERS_APP = ["FREE", "PRO", "ENTERPRISE"] as const
export const PLAN_TYPES = ["recurring"] as const
export const PLAN_BILLING_PERIODS = ["month", "year"] as const
export const TIER_MODES = Object.keys(TIER_MODES_MAP) as unknown as readonly [
  TierMode,
  ...TierMode[],
]
export const USAGE_MODES = Object.keys(USAGE_MODES_MAP) as unknown as readonly [
  UsageMode,
  ...UsageMode[],
]

export const AGGREGATION_METHODS = Object.keys(AGGREGATION_METHODS_MAP) as unknown as readonly [
  AggregationMethod,
  ...AggregationMethod[],
]

export const ROLES_APP = ["OWNER", "ADMIN", "MEMBER"] as const
export const WHEN_TO_BILLING = ["pay_in_advance", "pay_in_arrear"] as const
export const FEATURE_VERSION_TYPES = ["feature", "addon"] as const
export const SUBSCRIPTION_TYPES = ["plan", "addons"] as const
export const COLLECTION_METHODS = ["charge_automatically", "send_invoice"] as const
export const FEATURE_TYPES = Object.keys(FEATURE_TYPES_MAPS) as unknown as readonly [
  FeatureType,
  ...FeatureType[],
]
