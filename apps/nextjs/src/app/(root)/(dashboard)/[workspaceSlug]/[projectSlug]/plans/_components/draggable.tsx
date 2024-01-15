import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@builderai/ui/utils"

import type { Feature, TaskDragData } from "./feature-card"

export function SortableItem(props: {
  children: React.ReactNode
  feature: Feature
  className?: string
  isFeature?: boolean
}) {
  const {
    setNodeRef,
    setActivatorNodeRef, // use if there is a handle different from the node
    listeners,
    isDragging,
    isSorting,
    over,
    overIndex,
    attributes,
    transform,
    transition,
  } = useSortable({
    id: props.feature.id.toString(),
    data: {
      type: "Feature",
      feature: props.feature,
    } satisfies TaskDragData,
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  // TODO: Add a custom drag overlay
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(props.className, {
        "cursor-pointer": props.isFeature,
        "cursor-default": !props.isFeature,
      })}
    >
      {props.children}
    </div>
  )
}
