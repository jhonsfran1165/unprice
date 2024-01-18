"use client"

import { useMemo, useState } from "react"
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DropAnimation,
  UniqueIdentifier,
} from "@dnd-kit/core"
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
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
import { Separator } from "@builderai/ui/separator"

import { BoardColumn } from "./BoardColumn"
import type { Feature } from "./feature"
import { FeatureCard } from "./feature"
import { Features } from "./features"
import type { Column } from "./types"

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

export const dbFeatures: Feature[] = [
  {
    id: "0",
    content: "Feature test 1",
    type: "metered",
  },
  {
    id: "1",
    content: "Feature test 2",
    type: "metered",
  },
  {
    id: "2",
    content: "Feature test 3",
    type: "metered",
  },
  {
    id: "3",
    content: "Feature test 4",
    type: "metered",
  },
  {
    id: "4",
    content: "Feature test 5",
    type: "metered",
  },
  {
    id: "5",
    content: "Feature test 6",
    type: "metered",
  },
  {
    id: "6",
    content: "Feature test 7",
    type: "metered",
  },
  {
    id: "7",
    content: "Feature test 8",
    type: "metered",
  },
  {
    id: "8",
    content: "Feature test 9",
    type: "metered",
  },
  {
    id: "9",
    content: "Feature test 10",
    type: "metered",
  },
  {
    id: "10",
    content: "Feature test 11",
    type: "metered",
  },
]

export default function DragDrop() {
  const [columns, setColumns] = useState<Column[]>(defaultCols)
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns])

  const [features, setFeatures] = useState<Feature[]>(defaultFeatures)

  const featuresIds = useMemo(() => {
    return features.map((feature) => feature.id)
  }, [features])

  const searchableFeatures = useMemo(() => {
    return dbFeatures.filter((feature) => {
      return !featuresIds.includes(feature.id)
    })
  }, [featuresIds])

  const [activeFeature, setActiveFeature] = useState<Feature | null>(null)

  const [clonedFeatures, setClonedFeatures] = useState<Feature[] | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const onDragCancel = () => {
    if (clonedFeatures) {
      // Reset items to their original state in case items have been
      // Dragged across containers
      setClonedFeatures(features)
    }

    setClonedFeatures(null)
  }

  function deleteFeature(id: UniqueIdentifier) {
    const newFeature = features.filter((feature) => feature.id !== id)
    setFeatures(newFeature)
  }

  function createNewColumn() {
    const columnToAdd: Column = {
      id: generateId(),
      title: `Column ${columns.length + 1}`,
    }

    setColumns([...columns, columnToAdd])
  }

  function deleteColumn(id: UniqueIdentifier) {
    const filteredColumns = columns.filter((col) => col.id !== id)
    setColumns(filteredColumns)

    const newFeature = features.filter((t) => t.columnId !== id)
    setFeatures(newFeature)
  }

  function updateColumn(id: UniqueIdentifier, title: string) {
    const newColumns = columns.map((col) => {
      if (col.id !== id) return col
      return { ...col, title }
    })

    setColumns(newColumns)
  }

  function onDragStart(event: DragStartEvent) {
    // just copy the features in case the user cancels the drag
    setClonedFeatures(features)

    if (event.active.data.current?.type === "Feature") {
      setActiveFeature(event.active.data.current.feature as Feature)
      return
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveFeature(null)
    setClonedFeatures(null)

    const { active, over } = event

    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveColumn = active.data.current?.type === "Column"
    if (!isActiveColumn) return

    // For Column we only need to re-order the list
    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId)
      const overColumnIndex = columns.findIndex((col) => col.id === overId)

      return arrayMove(columns, activeColumnIndex, overColumnIndex)
    })
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event

    // only process if there is an over item
    if (!over) return

    // over represents the item that is being dragged over
    // active represents the item that is being dragged
    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const activeData = active.data.current
    const overData = over.data.current

    const isActiveFeature = activeData?.type === "Feature"
    const isOverAFeature = overData?.type === "Feature"
    const isOverAColumn = overData?.type === "Column"

    // only process features
    if (!isActiveFeature) return

    // I'm dropping a Feature over another Feature
    // the over feature can be inside a column or not
    if (isActiveFeature && isOverAFeature) {
      const overFeature = overData.feature as Feature

      // if the over feature has a column id then we don't need to do anything
      // because the over feature is in the search
      if (!overFeature?.columnId) return

      // if the over feature has a column id then we need to move the active feature to the same column
      setFeatures((features) => {
        const activeIndex = features.findIndex((t) => t.id === activeId)
        const overIndex = features.findIndex((t) => t.id === overId)
        const activeFeature = features[activeIndex]
        const overFeature = features[overIndex]

        // if the active feature is in the list
        // and the over feature is in the list
        // and the active feature is not in the same column as the over feature
        // then we need to move the active feature to the same column as the over feature
        if (
          activeFeature &&
          overFeature &&
          activeFeature.columnId !== overFeature.columnId
        ) {
          activeFeature.columnId = overFeature.columnId
          return arrayMove(features, activeIndex, overIndex - 1)
        } else if (!activeFeature && overFeature) {
          // if the active feature is not in the list then we need to add it to the list
          return arrayMove(
            [
              ...features,
              { ...activeData.feature, columnId: overFeature?.columnId },
            ],
            activeIndex,
            overIndex
          ) as Feature[]
        } else {
          // otherwise we only re-order the list
          return arrayMove(features, activeIndex, overIndex)
        }
      })
    }

    // I'm dropping a Feature over a column
    if (isActiveFeature && isOverAColumn) {
      setFeatures((features) => {
        const activeIndex = features.findIndex((t) => t.id === activeId)
        const activeFeature = features[activeIndex]

        // if the active feature is in the list then we need to move it to the new column
        if (activeFeature) {
          activeFeature.columnId = overId
          return arrayMove(features, activeIndex, activeIndex)
        } else {
          // if the active feature is not in the list then we need to add it to the list
          return [
            ...features,
            {
              ...activeData.feature,
              columnId: overId,
            },
          ] as Feature[]
        }
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragCancel={onDragCancel}
      collisionDetection={pointerWithin}
    >
      <ResizablePanelGroup direction="horizontal">
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
          <div className="flex flex-col p-3">
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

          {"document" in window &&
            createPortal(
              <DragOverlay adjustScale={false} dropAnimation={dropAnimation}>
                {activeFeature && <FeatureCard feature={activeFeature} />}
              </DragOverlay>,
              document.body
            )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          <Features features={searchableFeatures} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </DndContext>
  )
}
