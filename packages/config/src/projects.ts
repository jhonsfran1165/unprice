import { PLANS } from "./plans"

export const MEMBERSHIP = {
  Member: "basic_member",
  Admin: "admin",
} as const

export const PROJECT_TIER = {
  FREE: "FREE",
  PRO: "PRO",
} as const

export const PLANS_APP = Object.keys(PLANS) as unknown as readonly [
  string,
  ...string[],
]

export const PROJECT_TIERS_APP = Object.keys(
  PROJECT_TIER
) as unknown as readonly [string, ...string[]]

export type ProjectTier = (typeof PROJECT_TIER)[keyof typeof PROJECT_TIER]
