import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cva } from "class-variance-authority"
import { GripVertical } from "lucide-react"

import { Button } from "@builderai/ui/button"

import type { TaskDragData } from "./feature-card"

export function Draggable(props: {
  children: React.ReactNode
  taskId: string
  name: string
  isOverlay?: boolean
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.taskId,
    data: {
      type: "Task",
      task: {
        id: props.taskId,
        columnId: "todo",
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

  const variants = cva("", {
    variants: {
      dragging: {
        over: "ring-2 opacity-30",
        overlay: "ring-2 ring-primary",
      },
    },
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: props.isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <Button
        variant="ghost"
        {...attributes}
        {...listeners}
        className="-ml-2 h-auto cursor-grab p-1 text-secondary-foreground/50"
      >
        <span className="sr-only">Move task</span>
        <GripVertical />
        {props.children}
      </Button>
    </div>
  )
}
