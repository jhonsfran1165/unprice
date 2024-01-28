import type { UniqueIdentifier } from "@dnd-kit/core"

import type { Feature } from "@builderai/db/schema/price"

export type GroupType = "Group"

export type FeatureType = "Feature"

export type FeaturePlan = Feature & {
  groupId?: UniqueIdentifier
  config?: Record<string, unknown>
}

export interface Group {
  id: UniqueIdentifier
  title: string
}
