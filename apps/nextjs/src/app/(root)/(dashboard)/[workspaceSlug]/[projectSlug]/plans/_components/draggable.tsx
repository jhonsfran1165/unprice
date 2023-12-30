import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { TaskDragData } from "./feature-card"

export function Draggable(props: {
  children: React.ReactNode
  taskId: string
  name: string
  className?: string
  isOverlay?: boolean
}) {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({
      id: props.taskId,
      data: {
        type: "Task",
        task: {
          id: props.taskId,
          columnId: "features",
          content: props.name,
        },
      } satisfies TaskDragData,
      attributes: {
        roleDescription: "Task",
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
      className={props.className}
    >
      {props.children}
    </div>
  )
}
