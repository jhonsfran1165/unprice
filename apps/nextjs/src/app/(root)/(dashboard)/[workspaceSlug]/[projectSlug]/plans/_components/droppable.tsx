import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cva } from "class-variance-authority"

import { cn } from "@builderai/ui/utils"

import type { ColumnDragData } from "./BoardColumn"
import { animateLayoutChanges } from "./BoardColumn"
import type { Column } from "./types"

export function DroppableContainer(props: {
  children: React.ReactNode
  className?: string
  column: Column
  disabled?: boolean
  isEmpty?: boolean
  type?: string
}) {
  const { attributes, listeners, setNodeRef, transition, transform, isOver } =
    useSortable({
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
    opacity: isOver ? 0.7 : 1,
  }

  const variants = cva("w-full", {
    variants: {
      variant: {
        empty: "h-auto",
        default: "h-[500px] overflow-y-auto",
      },
    },
  })

  return (
    <div
      ref={props.disabled ? undefined : setNodeRef}
      style={style}
      className={cn(
        variants({
          variant: props.isEmpty ? "empty" : "default",
        }),
        props.className
      )}
      {...listeners}
      {...attributes}
    >
      {props.children}
    </div>
  )
}
