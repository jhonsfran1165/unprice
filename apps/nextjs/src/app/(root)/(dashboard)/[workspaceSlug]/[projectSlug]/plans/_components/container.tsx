// TODO: fix this
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useMemo, useState } from "react"
import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconDropdown } from "react-day-picker"

import { Button } from "@builderai/ui/button"
import { Input } from "@builderai/ui/input"

import { TaskCard } from "./feature-card"
import type { Column, Id, Task } from "./types"

interface Props {
  column: Column
  deleteColumn: (id: Id) => void
  updateColumn: (id: Id, title: string) => void

  createTask: (columnId: Id) => void
  updateTask: (id: Id, content: string) => void
  deleteTask: (id: Id) => void
  tasks: Task[]
}

function ColumnContainer({
  column,
  deleteColumn,
  updateColumn,
  createTask,
  tasks,
  deleteTask,
  updateTask,
}: Props) {
  const [editMode, setEditMode] = useState(false)

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
    },
    disabled: editMode,
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  if (isDragging) {
    return <div ref={setNodeRef} style={style}></div>
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex h-28 w-full flex-col items-center justify-between rounded-md border p-2.5 text-left hover:ring-2 hover:ring-inset hover:ring-rose-500"
    >
      {/* Column title */}
      <div
        {...attributes}
        {...listeners}
        onClick={() => {
          setEditMode(true)
        }}
        className="flex w-full items-center justify-between gap-2"
      >
        <div className="flex gap-2">
          {!editMode && column.title}
          {editMode && (
            <Input
              className="rounded border px-2 outline-none"
              value={column.title}
              onChange={(e) => updateColumn(column.id, e.target.value)}
              onBlur={() => {
                setEditMode(false)
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return
                setEditMode(false)
              }}
            />
          )}
        </div>
        <Button
          onClick={() => {
            deleteColumn(column.id)
          }}
        >
          <IconDropdown />
        </Button>
      </div>

      {/* Column task container */}
      <div className="flex w-full flex-grow flex-col gap-4 overflow-y-auto overflow-x-hidden p-2">
        <SortableContext items={tasksIds}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} isOverlay />
          ))}
        </SortableContext>
      </div>
      {/* Column footer */}
      <Button
        className="border-columnBackgroundColor border-x-columnBackgroundColor hover:bg-mainBackgroundColor flex items-center gap-2 rounded-md border-2 p-4 hover:text-rose-500 active:bg-black"
        onClick={() => {
          createTask(column.id)
        }}
      >
        <IconDropdown />
        Add task
      </Button>
    </div>
  )
}

export default ColumnContainer
