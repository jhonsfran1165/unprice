import { useMemo } from "react"
import { useDndContext } from "@dnd-kit/core"
import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cva } from "class-variance-authority"
import { GripVertical } from "lucide-react"

import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardHeader } from "@builderai/ui/card"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"

import type { Task } from "./feature-card"
import { TaskCard } from "./feature-card"
import type { Column } from "./types"

export type ColumnType = "Column"

export interface ColumnDragData {
  type: ColumnType
  column: Column
}

interface BoardColumnProps {
  column: Column
  tasks: Task[]
  isOverlay?: boolean
}

export function BoardColumn({ column, tasks, isOverlay }: BoardColumnProps) {
  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id)
  }, [tasks])

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  const variants = cva(
    "h-[500px] max-h-[500px] w-full bg-primary-foreground flex flex-col flex-shrink-0 snap-center",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary",
        },
      },
    }
  )

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="space-between flex flex-row items-center border-b-2 p-4 text-left font-semibold">
        <Button
          variant={"ghost"}
          {...attributes}
          {...listeners}
          className=" text-primary/50 relative -ml-2 h-auto cursor-grab p-1"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical />
        </Button>
        <span className="ml-auto"> {column.title}</span>
      </CardHeader>
      <ScrollArea>
        <CardContent className="flex flex-grow flex-col gap-2 p-2">
          <SortableContext items={tasksIds}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>
        </CardContent>
      </ScrollArea>
    </Card>
  )
}

export function BoardContainer({ children }: { children: React.ReactNode }) {
  const dndContext = useDndContext()

  const variations = cva("px-2 md:px-0 flex lg:justify-center pb-4", {
    variants: {
      dragging: {
        default: "snap-x snap-mandatory",
        active: "snap-none",
      },
    },
  })

  return (
    <ScrollArea
      className={variations({
        dragging: dndContext.active ? "active" : "default",
      })}
    >
      <div className="flex flex-row items-center justify-center gap-4">
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
