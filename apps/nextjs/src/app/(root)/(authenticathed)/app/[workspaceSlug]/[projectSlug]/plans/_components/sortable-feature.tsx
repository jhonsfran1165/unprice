"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@builderai/ui"

import type { FeaturePlanProps } from "./feature-plan"
import { FeaturePlan } from "./feature-plan"

export function SortableFeature(props: FeaturePlanProps) {
  const {
    setNodeRef,
    listeners,
    isDragging,
    attributes,
    transform,
    transition,
  } = useSortable({
    id: props.feature.id,
    data: {
      mode: props.mode,
      feature: props.feature,
    },
    attributes: {
      roleDescription: props.mode,
    },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  const isFeature = props.mode === "Feature"

  return (
    <FeaturePlan
      ref={props.disabled ? undefined : setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(props.className, {
        "cursor-pointer": !isFeature,
        "cursor-grab": isFeature,
        "cursor-pointer border-dashed border-primary-solid opacity-80":
          isDragging && !isFeature,
      })}
      {...props}
    />
  )
}
