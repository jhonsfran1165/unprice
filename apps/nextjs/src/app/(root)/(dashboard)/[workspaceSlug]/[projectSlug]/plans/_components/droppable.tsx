import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { ColumnDragData } from "./BoardColumn"
import { animateLayoutChanges } from "./BoardColumn"
import type { Column } from "./types"

export function DroppableContainer(props: {
  children: React.ReactNode
  className?: string
  column: Column
}) {
  const {
    active,
    attributes,
    listeners,
    over,
    setNodeRef,
    transition,
    transform,
    isOver,
  } = useSortable({
    id: props.column.id,
    data: {
      type: "Column",
      column: props.column,
    } satisfies ColumnDragData,
    animateLayoutChanges,
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isOver ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={props.className}
      {...listeners}
      {...attributes}
    >
      {props.children}
    </div>
  )
}
