import type { UniqueIdentifier } from "@dnd-kit/core"

export interface Column {
  id: UniqueIdentifier
  title: string
}

export interface Task {
  id: UniqueIdentifier
  columnId: UniqueIdentifier
  content: string
}
