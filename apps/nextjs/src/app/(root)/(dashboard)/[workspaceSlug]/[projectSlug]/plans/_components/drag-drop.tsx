"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  KeyboardSensor,
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
  sortableKeyboardCoordinates,
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
import type { Feature } from "./feature"
import { FeatureCard } from "./feature"
import { Features } from "./features"
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

type Items = Record<UniqueIdentifier, Feature[]>

const initialItems = {
  base: [],
}

const itemCount = 3
export const TRASH_ID = "void"
const PLACEHOLDER_ID = "placeholder"
const empty: UniqueIdentifier[] = []

export default function DragDrop() {
  const [columns, setColumns] = useState<Column[]>(defaultCols)
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns])

  const [items, setItems] = useState<Items>(initialItems)

  const [containers, setContainers] = useState(
    Object.keys(items) as UniqueIdentifier[]
  )

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const lastOverId = useRef<UniqueIdentifier | null>(null)
  const recentlyMovedToNewContainer = useRef(false)
  const isSortingContainer = activeId ? containers.includes(activeId) : false

  const [clonedItems, setClonedItems] = useState<Items | null>(null)

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
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const onDragCancel = () => {
    if (clonedItems) {
      // Reset items to their original state in case items have been
      // Dragged across containers
      setItems(clonedItems)
    }

    setActiveId(null)
    setClonedItems(null)
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false
    })
  }, [items])

  const [features, setFeatures] = useState<Feature[]>(defaultFeatures)

  const itemsIds = useMemo(
    () =>
      features
        .map((feature) => {
          return feature.id
        })
        .flat(),
    [features]
  )

  const searchableFeatures = useMemo(() => {
    return dbFeatures.filter((feature) => {
      return !itemsIds.includes(feature.id)
    })
  }, [itemsIds])

  const [activeColumn, setActiveColumn] = useState<Column | null>(null)

  const [activeFeature, setActiveFeature] = useState<Feature | null>(null)

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
    // we don't need to validate if item is over a column or a feature
    // we don't support nested features
    // we only support features inside columns
    setActiveId(event.active.id)
    setClonedItems(items)

    console.log("DRAG START", { event })

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
    setActiveColumn(null)
    setActiveFeature(null)

    const { active, over } = event

    console.log("DRAG END", { event })

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

    console.log("DRAG OVER", { event })

    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    // if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current
    const overData = over.data.current

    const isActiveAFeature = activeData?.type === "Feature"
    const isActiveAColumn = activeData?.type === "Column"
    const isOverAFeature = overData?.type === "Feature"
    const isOverAColumn = overData?.type === "Column"

    // only process features
    if (!isActiveAFeature) return

    // Im dragging a Feature over another Feature
    // or Im dragging a Feature over a column

    // if this is the first feature in the list
    // just add it to the list
    // if (features.length === 0 && activeFeature) {
    //   const hasColumnId = overData?.feature?.columnId

    //   if (!hasColumnId) return

    //   setFeatures([{ ...activeFeature, columnId: hasColumnId }])
    // }

    // Im dropping a Feature over another Feature
    if (isActiveAFeature && isOverAFeature) {
      // if the over feature has a column id then we don't need to do anything
      // because the over is in the search
      if (!overData?.feature?.columnId) return

      // if the over feature has a column id then we need to move the active feature
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
        } else if (!activeFeature) {
          return arrayMove(
            [
              ...features,
              { ...activeData.feature, columnId: overFeature.columnId },
            ],
            activeIndex,
            overIndex
          )
        } else {
          return arrayMove(features, activeIndex, overIndex)
        }
      })
    }

    // Im dropping a Feature over a column
    if (isActiveAFeature && isOverAColumn) {
      setFeatures((features) => {
        // if feature is null, then we are dragging from the search for the first time
        // and we need to add the feature to the list
        if (features.length === 0) {
          return [{ ...activeData.feature, columnId: overData?.column?.id }]
        }

        const activeIndex = features.findIndex((t) => t.id === activeId)
        const activeFeature = features[activeIndex]

        // if the active feature is in the list then we need to move it to the new column
        if (activeFeature) {
          activeFeature.columnId = overId
          return arrayMove(features, activeIndex, activeIndex)
        } else {
          // if the active feature is not in the list then we need to add it to the list
          return [...features, { ...activeData.feature, columnId: overId }]
        }
      })
    }
  }

  console.log("features", features)

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
          <div className="flex flex-col">
            <ScrollArea className="max-h-[800px] flex-1 overflow-y-auto">
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
