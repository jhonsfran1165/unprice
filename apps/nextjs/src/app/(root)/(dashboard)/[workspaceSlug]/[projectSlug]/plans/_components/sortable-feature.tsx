import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@builderai/ui/utils"

import type { Feature, TaskDragData } from "./feature"
import { FeatureCard } from "./feature"
import type { Id } from "./types"

export function SortableFeature(props: {
  feature: Feature
  deleteFeature?: (id: Id) => void
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
    <FeatureCard
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(props.className, {
        "cursor-pointer": props.isFeature,
        "cursor-default": !props.isFeature,
      })}
      deleteFeature={props.deleteFeature}
      feature={props.feature}
      isFeature={props.isFeature}
    />
  )
}
