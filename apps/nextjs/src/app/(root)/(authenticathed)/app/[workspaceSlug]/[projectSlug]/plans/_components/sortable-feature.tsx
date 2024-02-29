import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { FeaturePlan, FeatureType } from "@builderai/db/validators"
import { cn } from "@builderai/ui"

import type { FeatureCardProps } from "./feature"
import { FeatureCard } from "./feature"

export interface DragData {
  type: FeatureType
  feature: FeaturePlan
}

export function SortableFeature(
  props: FeatureCardProps & {
    className?: string
    disabled?: boolean
  }
) {
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

  const isFeature = props.type === "Feature"

  return (
    <FeatureCard
      ref={props.disabled ? undefined : setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(props.className, {
        "cursor-move": !isFeature,
        "cursor-grab": isFeature,
        "border-dashed opacity-80": isDragging && !isFeature,
      })}
      {...props}
    />
  )
}
