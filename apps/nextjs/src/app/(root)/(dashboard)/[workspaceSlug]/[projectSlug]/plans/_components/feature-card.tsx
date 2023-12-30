import type { UniqueIdentifier } from "@dnd-kit/core"

import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import { Trash2 } from "@builderai/ui/icons"
import { cn } from "@builderai/ui/utils"

import type { defaultCols } from "./drag-drop"
import { Draggable } from "./draggable"
import { FeatureForm } from "./feature-form"
import type { Id } from "./types"

export type ColumnId = (typeof defaultCols)[number]["id"]

export interface Task {
  id: UniqueIdentifier
  columnId: ColumnId
  content: string
}

interface TaskCardProps {
  task: Task
  isOverlay?: boolean
  deleteTask: (id: Id) => void
}

export type TaskType = "Task"

export interface TaskDragData {
  type: TaskType
  task: Task
}

export function TaskCard({ task, deleteTask }: TaskCardProps) {
  return (
    <Draggable name={task.content} taskId={task.id.toString()}>
      <div
        className={cn(
          "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
        )}
      >
        <div className="flex w-full flex-col gap-1">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="font-semibold">{task.content}</div>
            </div>
            <div className={"ml-auto flex items-center"}>
              <Badge className="mr-2">metered</Badge>
              <FeatureForm />
              <Button
                onClick={() => deleteTask(task.id)}
                variant="ghost"
                size={"icon"}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">delete of plan</span>
              </Button>
            </div>
          </div>
          <div className="text-xs font-medium">{task.content}</div>
        </div>
        <div className="line-clamp-2 text-xs text-muted-foreground">
          {"jakshdk jasdkjhasdk jhaskdjh askdjhasdkjhadkjahsdk ajsdhkasjhsdaks jdhaskjdhaskdjhaskdj askdjhasdkjhasd askjhdas".substring(
            0,
            300
          )}
        </div>
        <div className={cn("ml-auto flex items-center text-xs")}>
          1000 calls per $5 USD
        </div>
      </div>
    </Draggable>
  )
}
