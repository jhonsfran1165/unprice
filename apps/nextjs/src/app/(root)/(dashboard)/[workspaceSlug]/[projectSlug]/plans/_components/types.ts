import type { UniqueIdentifier } from "@dnd-kit/core"

export type GroupType = "Group"

export type FeatureType = "Feature"

export interface Feature {
  id: UniqueIdentifier
  groupId?: UniqueIdentifier
  content: string
  type: string
}

export interface Group {
  id: UniqueIdentifier
  title: string
}
