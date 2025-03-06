import type { PlanType } from "../validators/shared"

export const TIER_MODES_MAP = {
  volume: {
    label: "Volume",
    description: "All units priced based on final tier reached",
  },
  graduated: {
    label: "Graduated",
    description: "Tiers applies progressively as quantity increases",
  },
} as const

export const FEATURE_TYPES_MAPS = {
  flat: {
    code: "flat",
    label: "Flat",
    description: "Fixed price for a single unit or package",
  },
  tier: {
    code: "tier",
    label: "Tier",
    description: "Offers different prices based on unit quantity",
  },
  package: {
    code: "package",
    label: "Package",
    description: "Price by package, bundle or group of units",
  },
  usage: {
    code: "usage",
    label: "Usage",
    description: "Pay as you go based on usage",
  },
} as const

export const USAGE_MODES_MAP = {
  tier: {
    code: "tier",
    label: "Tier",
    description: "Price based on quantity of units",
  },
  package: {
    code: "package",
    label: "Package",
    description: "Price by package, bundle or group of units",
  },
  unit: {
    code: "unit",
    label: "Unit",
    description: "Price by number of units, like seats, users, etc",
  },
} as const

export const AGGREGATION_METHODS_MAP = {
  sum: {
    label: "Sum",
    description: "Adds up all events values within the current cycle period",
  },
  sum_all: {
    label: "Sum all",
    description: "Adds up all events values ever",
  },
  last_during_period: {
    label: "Last during period",
    description: "Last event value during the current cycle period",
  },
  count: {
    label: "Count",
    description: "Counts the number of events within the current cycle period",
  },
  count_all: {
    label: "Count all",
    description: "Counts the number of events ever",
  },
  max: {
    label: "Maximum",
    description: "Maximum event value within the current cycle period",
  },
  max_all: {
    label: "Maximum all",
    description: "Maximum event value ever",
  },
} as const

export const BILLING_INTERVALS = ["month", "year", "day", "minute", "onetime"] as const

export const BILLING_CONFIG: Record<
  string,
  {
    label: string
    description: string
    billingInterval: (typeof BILLING_INTERVALS)[number]
    billingIntervalCount: number
    billingAnchorOptions: (number | "dayOfCreation")[]
    dev?: boolean
    planType: PlanType
  }
> = {
  monthly: {
    label: "Monthly",
    description: "Billed monthly at the specified billing anchor",
    billingInterval: "month",
    billingIntervalCount: 1,
    billingAnchorOptions: ["dayOfCreation", ...Array.from({ length: 31 }, (_, i) => i + 1)],
    planType: "recurring",
  },
  yearly: {
    label: "Yearly",
    description: "Billed yearly at the specified billing anchor",
    billingInterval: "year",
    billingIntervalCount: 1,
    billingAnchorOptions: ["dayOfCreation", ...Array.from({ length: 12 }, (_, i) => i + 1)],
    planType: "recurring",
  },
  "every-5-minutes": {
    label: "Every 5 minutes",
    description: "Billed every 5 minutes",
    billingInterval: "minute",
    billingIntervalCount: 5,
    billingAnchorOptions: [],
    dev: true,
    planType: "recurring",
  },
  onetime: {
    label: "Onetime",
    description: "Billed once",
    billingInterval: "onetime",
    billingIntervalCount: 1,
    billingAnchorOptions: [],
    planType: "onetime",
  },
}

type AggregationMethod = keyof typeof AGGREGATION_METHODS_MAP
export type TierMode = keyof typeof TIER_MODES_MAP
export type UsageMode = keyof typeof USAGE_MODES_MAP
export type FeatureType = keyof typeof FEATURE_TYPES_MAPS

export const PAYMENT_PROVIDERS = ["stripe", "lemonsqueezy"] as const
export const CURRENCIES = ["USD", "EUR"] as const
export const STAGES = ["prod", "test", "dev"] as const
export const STATUS_PLAN = ["draft", "published"] as const

// this status represents the status of the subscription, it would be the same for all phases
// but phases can have different statuses than the subscription is they are not active
// for instance a phase was changed to new plan, we create a new phase with status as active
// and we leave the old phase with status changed.
export const SUBSCRIPTION_STATUS = [
  "idle", // the subscription is idle
  "renewing", // the subscription is renewing
  "changing", // the subscription is changing
  "canceling", // the subscription is canceling
  "expiring", // the subscription is expiring
  "invoicing", // the subscription is invoicing
  "invoiced", // the subscription is invoiced, ready to be renewed
  "ending_trial", // the subscription is ending trial
  "active", // the subscription is active
  "trialing", // the subscription is trialing
  "canceled", // the subscription is cancelled
  "expired", // the subscription has expired - no auto-renew
  "past_due", // the subscription is past due - payment pending
] as const

export const PLAN_TYPES = ["recurring", "onetime"] as const
export const ROLES_APP = ["OWNER", "ADMIN", "MEMBER"] as const
export const WHEN_TO_BILLING = ["pay_in_advance", "pay_in_arrear"] as const
export const DUE_BEHAVIOUR = ["cancel", "downgrade"] as const
export const INVOICE_STATUS = ["unpaid", "paid", "waiting", "void", "draft", "failed"] as const
export const INVOICE_TYPE = ["flat", "usage", "hybrid"] as const
export const FEATURE_VERSION_TYPES = ["feature", "addon"] as const
export const COLLECTION_METHODS = ["charge_automatically", "send_invoice"] as const

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
export const FEATURE_TYPES = Object.keys(FEATURE_TYPES_MAPS) as unknown as readonly [
  FeatureType,
  ...FeatureType[],
]
