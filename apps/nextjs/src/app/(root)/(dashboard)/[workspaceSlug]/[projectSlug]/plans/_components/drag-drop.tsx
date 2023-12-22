"use client"

import { useMemo, useState } from "react"
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove, SortableContext } from "@dnd-kit/sortable"
import { createPortal } from "react-dom"

import { Button } from "@builderai/ui/button"
import { Add } from "@builderai/ui/icons"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { BoardColumn } from "./BoardColumn"
import type { ColumnId } from "./feature-card"
import { TaskCard } from "./feature-card"
import { FeatureGroupEmptyPlaceholder } from "./feature-group-place-holder"
import type { Column, Id, Task } from "./types"

export const defaultCols: Column[] = [
  {
    id: "todo",
    title: "Todo",
  },
  {
    id: "doing",
    title: "Work in progress",
  },
  {
    id: "done",
    title: "Done",
  },
]

const defaultTasks: Task[] = [
  {
    id: "1",
    columnId: "todo",
    content: "List admin APIs for dashboard",
  },
  {
    id: "2",
    columnId: "done",
    content: "Deliver dashboard prototype",
  },
  {
    id: "3",
    columnId: "doing",
    content: "Design and implement responsive UI",
  },
]

export default function DragDrop({ children }: { children: React.ReactNode }) {
  const [columns, setColumns] = useState<Column[]>(defaultCols)
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns])

  const [tasks, setTasks] = useState<Task[]>(defaultTasks)

  const [activeColumn, setActiveColumn] = useState<Column | null>(null)

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  )

  function createTask(columnId: Id) {
    const newTask: Task = {
      id: generateId(),
      columnId,
      content: `Task ${tasks.length + 1}`,
    }

    setTasks([...tasks, newTask])
  }

  function deleteTask(id: Id) {
    const newTasks = tasks.filter((task) => task.id !== id)
    setTasks(newTasks)
  }

  function updateTask(id: Id, content: string) {
    const newTasks = tasks.map((task) => {
      if (task.id !== id) return task
      return { ...task, content }
    })

    setTasks(newTasks)
  }

  function createNewColumn() {
    const columnToAdd: Column = {
      id: generateId(),
      title: `Column ${columns.length + 1}`,
    }

    setColumns([...columns, columnToAdd])
  }

  function deleteColumn(id: Id) {
    const filteredColumns = columns.filter((col) => col.id !== id)
    setColumns(filteredColumns)

    const newTasks = tasks.filter((t) => t.columnId !== id)
    setTasks(newTasks)
  }

  function updateColumn(id: Id, title: string) {
    const newColumns = columns.map((col) => {
      if (col.id !== id) return col
      return { ...col, title }
    })

    setColumns(newColumns)
  }

  function onDragStart(event: DragStartEvent) {
    console.log(event)
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column)
      return
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task)
      return
    }
  }

  function onDragEnd(event: DragEndEvent) {
    console.log("DRAG END")
    setActiveColumn(null)
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveAColumn = active.data.current?.type === "Column"
    if (!isActiveAColumn) return

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId)

      const overColumnIndex = columns.findIndex((col) => col.id === overId)

      return arrayMove(columns, activeColumnIndex, overColumnIndex)
    })
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    // if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current
    const overData = over.data.current

    const isActiveATask = activeData?.type === "Task"
    const isOverATask = activeData?.type === "Task"

    console.log("DRAG OVER", { isOverATask, isActiveATask })

    if (!isActiveATask) return

    // Im dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const overIndex = tasks.findIndex((t) => t.id === overId)
        const activeTask = tasks[activeIndex]
        const overTask = tasks[overIndex]
        if (
          activeTask &&
          overTask &&
          activeTask.columnId !== overTask.columnId
        ) {
          activeTask.columnId = overTask.columnId
          return arrayMove(tasks, activeIndex, overIndex - 1)
        }

        return arrayMove(tasks, activeIndex, overIndex)
      })
    }

    const isOverAColumn = overData?.type === "Column"

    console.log("DRAG OVER", { isOverAColumn, isActiveATask })

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const activeTask = tasks[activeIndex]

        if (activeTask) {
          activeTask.columnId = overId as ColumnId
          return arrayMove(tasks, activeIndex, activeIndex)
        }

        return [...tasks, activeData.task]
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <div className="grid grid-cols-12">
        <div className="col-span-9 border-l">
          <div className="h-full px-4 py-6 lg:px-8">
            <Tabs defaultValue="music" className="h-full space-y-6">
              <div className="space-between flex items-center">
                <TabsList>
                  <TabsTrigger value="music" className="relative">
                    Features
                  </TabsTrigger>
                  <TabsTrigger value="podcasts">Addons</TabsTrigger>
                  <TabsTrigger value="live" disabled>
                    Preview
                  </TabsTrigger>
                </TabsList>
                <div className="ml-auto mr-4">
                  <Button>
                    <Add className="mr-2 h-4 w-4" />
                    Add feature group
                  </Button>
                </div>
              </div>
              <TabsContent
                value="music"
                className="border-none p-0 outline-none"
              >
                <ScrollArea>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Base package
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Base features of the plan
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  {"document" in window &&
                    createPortal(
                      <DragOverlay>
                        {activeTask && <TaskCard task={activeTask} isOverlay />}
                      </DragOverlay>,
                      document.body
                    )}
                  <FeatureGroupEmptyPlaceholder />
                  <SortableContext items={columnsId}>
                    {columns.map((col) => (
                      <BoardColumn
                        key={col.id}
                        column={col}
                        tasks={tasks.filter((task) => task.columnId === col.id)}
                      />
                    ))}
                  </SortableContext>
                </ScrollArea>
              </TabsContent>
              <TabsContent
                value="podcasts"
                className="h-full flex-col border-none p-0 data-[state=active]:flex"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Addons Feature
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Addons that a user can add to the plan
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
                <FeatureGroupEmptyPlaceholder />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="col-span-3 border-l">{children}</div>
      </div>
    </DndContext>
  )
}

function generateId() {
  /* Generate a random number between 0 and 10000 */
  return Math.floor(Math.random() * 10001)
}
