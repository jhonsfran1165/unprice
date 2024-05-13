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
    id: props.planFeatureVersion.featureId,
    data: {
      mode: props.mode,
      planFeatureVersion: props.planFeatureVersion,
    },
    attributes: {
      roleDescription: props.mode,
    },
    disabled: props.disabled,
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
        "cursor-pointer border-dashed opacity-80": isDragging && !isFeature,
      })}
      {...props}
    />
  )
}
