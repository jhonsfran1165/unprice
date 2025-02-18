import type { Duration } from "date-fns"

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

export const PLAN_BILLING_PERIODS = ["month", "year", "onetime", "5m"] as const
type billingKeys = (typeof PLAN_BILLING_PERIODS)[number]

export const BILLING_PERIODS_MAP: Record<
  billingKeys,
  {
    label: string
    recurring: boolean
    description: string
    duration: Duration
    alignToCalendar?: boolean
  }
> = {
  month: {
    label: "Month",
    recurring: true,
    description: "Every month",
    duration: {
      months: 1,
    } as Duration,
    alignToCalendar: true,
  },
  year: {
    label: "Year",
    recurring: true,
    description: "Every year",
    duration: {
      years: 1,
    } as Duration,
    alignToCalendar: true,
  },
  onetime: {
    label: "Onetime",
    recurring: false,
    description: "One time payment",
    duration: {
      days: 0,
    } as Duration,
  },
  "5m": {
    label: "5 minutes",
    recurring: true,
    description: "Every 5 minutes",
    duration: {
      minutes: 5,
    } as Duration,
    alignToCalendar: false,
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
export const STATUS_PHASE = [
  "active", // the phase is active
  "trialing", // the phase is trialing
  "changed", // the phase is changed
  "canceled", // the phase is cancelled
  "expired", // the phase has expired - no auto-renew
  "past_dued", // the phase is past due - payment pending
  "trial_ended", // the phase trial has ended
] as const

export const PLAN_TYPES = ["recurring"] as const
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
