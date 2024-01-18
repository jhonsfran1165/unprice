import type { UniqueIdentifier } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@builderai/ui/utils"

import type { DragData, Feature } from "./feature"
import { FeatureCard } from "./feature"

export function SortableFeature(props: {
  feature: Feature
  deleteFeature?: (id: UniqueIdentifier) => void
  className?: string
  isFeature?: boolean
}) {
  const {
    setNodeRef,
    listeners,
    isDragging,
    attributes,
    transform,
    transition,
  } = useSortable({
    id: props.feature.id.toString(),
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
      ref={setNodeRef}
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
