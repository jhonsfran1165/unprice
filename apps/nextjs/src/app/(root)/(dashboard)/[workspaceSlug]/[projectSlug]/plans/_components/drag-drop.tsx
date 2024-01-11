"use client"

import { useMemo, useState } from "react"
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DropAnimation,
} from "@dnd-kit/core"
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { createPortal } from "react-dom"

import { Accordion } from "@builderai/ui/accordion"
import { Button } from "@builderai/ui/button"
import { Add } from "@builderai/ui/icons"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@builderai/ui/resizable"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"

import { BoardColumn } from "./BoardColumn"
import type { Feature } from "./feature-card"
import { FeatureCard } from "./feature-card"
import type { Column, Id } from "./types"

function generateId() {
  /* Generate a random number between 0 and 10000 */
  return Math.floor(Math.random() * 10001)
}

export const defaultCols: Column[] = [
  {
    id: "base",
    title: "Base Features",
  },
]

const defaultFeatures: Feature[] = []

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
}

export default function DragDrop({ children }: { children: React.ReactNode }) {
  const [columns, setColumns] = useState<Column[]>(defaultCols)
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns])

  const [features, setFeatures] = useState<Feature[]>(defaultFeatures)

  console.log("features", features)

  const [activeColumn, setActiveColumn] = useState<Column | null>(null)

  const [activeFeature, setActiveFeature] = useState<Feature | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  )

  function deleteFeature(id: Id) {
    const newFeature = features.filter((feature) => feature.id !== id)
    setFeatures(newFeature)
  }

  function updateFeature(id: Id, content: string) {
    const newFeature = features.map((feature) => {
      if (feature.id !== id) return feature
      return { ...feature, content }
    })

    setFeatures(newFeature)
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

    const newFeature = features.filter((t) => t.columnId !== id)
    setFeatures(newFeature)
  }

  function updateColumn(id: Id, title: string) {
    const newColumns = columns.map((col) => {
      if (col.id !== id) return col
      return { ...col, title }
    })

    setColumns(newColumns)
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column)
      return
    }

    if (event.active.data.current?.type === "Feature") {
      setActiveFeature(event.active.data.current.feature)
      return
    }
  }

  function onDragEnd(event: DragEndEvent) {
    console.log("DRAG END")
    setActiveColumn(null)
    setActiveFeature(null)

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

    const isActiveAFeature = activeData?.type === "Feature"
    const isOverAFeature = activeData?.type === "Feature"

    console.log("DRAG OVER", { activeData, overData, features })

    if (features.length === 0 && activeFeature) {
      setFeatures([{ ...activeFeature, columnId: overId }])
    }

    if (!isActiveAFeature) return

    // Im dropping a Feature over another Feature
    if (isActiveAFeature && isOverAFeature) {
      setFeatures((features) => {
        const activeIndex = features.findIndex((t) => t.id === activeId)
        const overIndex = features.findIndex((t) => t.id === overId)
        const activeFeature = features[activeIndex]
        const overFeature = features[overIndex]
        if (
          activeFeature &&
          overFeature &&
          activeFeature.columnId !== overFeature.columnId
        ) {
          activeFeature.columnId = overFeature.columnId
          return arrayMove(features, activeIndex, overIndex - 1)
        }

        return arrayMove(features, activeIndex, overIndex)
      })
    }

    const isOverAColumn = overData?.type === "Column"

    console.log("DRAG OVER", { isOverAColumn, isActiveAFeature })

    console.log(
      "isActiveAFeature && isOverAColumn",
      isActiveAFeature && isOverAColumn
    )
    // Im dropping a Feature over a column
    if (isActiveAFeature && isOverAColumn) {
      setFeatures((features) => {
        const activeIndex = features.findIndex((t) => t.id === activeId)
        const activeFeature = features[activeIndex]

        if (activeFeature) {
          activeFeature.columnId = overId
          return arrayMove(features, activeIndex, activeIndex)
        }

        return [...features, activeData.feature]
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
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={80} minSize={50}>
          <div className="p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex w-full flex-col align-middle">
                <h2 className="text-xl font-semibold tracking-tight">
                  Add the features of your plan
                </h2>
                <p className="text-sm text-muted-foreground">
                  Base features of the plan
                </p>
              </div>
              <div className="flex w-full justify-end">
                <Button
                  onClick={() => {
                    createNewColumn()
                  }}
                  variant={"outline"}
                  size={"sm"}
                >
                  <Add className="mr-2 h-4 w-4" />
                  Add feature group
                </Button>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col">
            <ScrollArea className="grow">
              <div className="flex flex-col gap-4 p-4">
                <Accordion type="multiple" className="space-y-2">
                  {/* context for columns */}
                  <SortableContext
                    items={columnsId}
                    strategy={verticalListSortingStrategy}
                  >
                    {columns.map((col) => (
                      <BoardColumn
                        key={col.id}
                        deleteColumn={deleteColumn}
                        updateColumn={updateColumn}
                        deleteFeature={deleteFeature}
                        column={col}
                        features={features.filter(
                          (feature) => feature.columnId === col.id
                        )}
                      />
                    ))}
                  </SortableContext>
                </Accordion>
              </div>
            </ScrollArea>
          </div>

          {"document" in window &&
            createPortal(
              <DragOverlay adjustScale={false} dropAnimation={dropAnimation}>
                {activeFeature && (
                  <FeatureCard
                    deleteFeature={deleteFeature}
                    feature={activeFeature}
                  />
                )}
              </DragOverlay>,
              document.body
            )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </DndContext>
  )
}
