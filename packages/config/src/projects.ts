export const MEMBERSHIP = {
  Member: "basic_member",
  Admin: "admin",
} as const

export const PROJECT_TIER = {
  FREE: "FREE",
  PRO: "PRO",
} as const

export type ProjectTier = (typeof PROJECT_TIER)[keyof typeof PROJECT_TIER]
