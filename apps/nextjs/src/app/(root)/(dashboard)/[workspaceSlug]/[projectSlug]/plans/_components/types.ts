import type { UniqueIdentifier } from "@dnd-kit/core"

export type Id = UniqueIdentifier

export interface Column {
  id: Id
  title: string
}

export interface Task {
  id: Id
  columnId: Id
  content: string
}
