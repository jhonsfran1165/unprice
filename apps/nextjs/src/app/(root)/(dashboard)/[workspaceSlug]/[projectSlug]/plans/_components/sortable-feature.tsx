import type { UniqueIdentifier } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@builderai/ui/utils"

import { FeatureCard } from "./feature"
import type { Feature, FeatureType } from "./types"

export interface DragData {
  type: FeatureType
  feature: Feature
}

export function SortableFeature(props: {
  feature: Feature
  deleteFeature?: (id: UniqueIdentifier) => void
  className?: string
  isFeature?: boolean
  disabled?: boolean
}) {
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
      type: "Feature",
      feature: props.feature,
    } satisfies DragData,
    attributes: {
      roleDescription: "Feature",
    },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  return (
    <FeatureCard
      ref={props.disabled ? undefined : setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(props.className, {
        "cursor-move": !props.isFeature,
        "cursor-grab": props.isFeature,
        "border-dashed opacity-80": isDragging && !props.isFeature,
      })}
      deleteFeature={props.deleteFeature}
      feature={props.feature}
      isFeature={props.isFeature}
    />
  )
}
