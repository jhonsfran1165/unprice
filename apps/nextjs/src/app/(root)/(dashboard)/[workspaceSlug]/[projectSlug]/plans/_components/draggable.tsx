import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@builderai/ui/utils"

import type { Feature, TaskDragData } from "./feature-card"

export function Draggable(props: {
  children: React.ReactNode
  feature: Feature
  className?: string
  isFeature?: boolean
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
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
    attributes: {
      roleDescription: "Feature",
    },
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
