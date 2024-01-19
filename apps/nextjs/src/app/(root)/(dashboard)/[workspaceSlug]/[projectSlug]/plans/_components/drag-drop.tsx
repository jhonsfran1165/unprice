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
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"

import { FeatureCard } from "./feature"
import { FeatureGroup } from "./feature-group"
import { FeatureGroupEmptyPlaceholder } from "./feature-group-place-holder"
import { Features } from "./features"
import { SortableFeature } from "./sortable-feature"
import type { Feature, FeatureType, Group, GroupType } from "./types"

function generateId() {
  // generate a random id
  return Math.random().toString(36).substr(2, 9)
}

export const defaultGrops: Group[] = [
  {
    id: generateId(),
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
  const [groups, setGroups] = useState<Group[]>(defaultGrops)
  const groupIds = useMemo(() => groups.map((g) => g.id), [groups])

  console.log("groups", groups)

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

  function createNewGroup() {
    const groupToAdd: Group = {
      id: generateId(),
      title: `Group ${groups.length + 1}`,
    }

    setGroups([...groups, groupToAdd])
  }

  function deleteGroup(id: UniqueIdentifier) {
    const filteredGroups = groups.filter((g) => g.id !== id)
    setGroups(filteredGroups)

    const newFeature = features.filter((t) => t.groupId !== id)
    setFeatures(newFeature)
  }

  function updateGroup(id: UniqueIdentifier, title: string) {
    const newGroups = groups.map((g) => {
      if (g.id !== id) return g
      return { ...g, title }
    })

    setGroups(newGroups)
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

    // get string from GroupType
    const isActiveGroup = active.data.current?.type === ("Group" as GroupType)
    if (!isActiveGroup) return

    // For Group we only need to re-order the list
    setGroups((groups) => {
      const activeGroupIndex = groups.findIndex((g) => g.id === activeId)
      const overGroupIndex = groups.findIndex((g) => g.id === overId)

      return arrayMove(groups, activeGroupIndex, overGroupIndex)
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

    const isActiveFeature = activeData?.type === ("Feature" as FeatureType)
    const isOverAFeature = overData?.type === ("Feature" as FeatureType)
    const isOverAGroup = overData?.type === ("Group" as GroupType)

    // only process features
    if (!isActiveFeature) return

    // I'm dropping a Feature over another Feature
    // the over feature can be inside a group or not
    if (isActiveFeature && isOverAFeature) {
      const overFeature = overData.feature as Feature

      // if the over feature has a group id then we don't need to do anything
      // because the over feature is in the search
      if (!overFeature?.groupId) return

      // if the over feature has a group id then we need to move the active feature to the same group
      setFeatures((features) => {
        const activeIndex = features.findIndex((t) => t.id === activeId)
        const overIndex = features.findIndex((t) => t.id === overId)
        const activeFeature = features[activeIndex]
        const overFeature = features[overIndex]

        // if the active feature is in the list
        // and the over feature is in the list
        // and the active feature is not in the same group as the over feature
        // then we need to move the active feature to the same group as the over feature
        if (
          activeFeature &&
          overFeature &&
          activeFeature.groupId !== overFeature.groupId
        ) {
          activeFeature.groupId = overFeature.groupId
          return arrayMove(features, activeIndex, overIndex - 1)
        } else if (!activeFeature && overFeature) {
          // if the active feature is not in the list then we need to add it to the list
          return arrayMove(
            [
              ...features,
              { ...activeData.feature, groupId: overFeature?.groupId },
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

    // I'm dropping a Feature over a group
    if (isActiveFeature && isOverAGroup) {
      setFeatures((features) => {
        const activeIndex = features.findIndex((t) => t.id === activeId)
        const activeFeature = features[activeIndex]

        // if the active feature is in the list then we need to move it to the new group
        if (activeFeature) {
          activeFeature.groupId = overId
          return arrayMove(features, activeIndex, activeIndex)
        } else {
          // if the active feature is not in the list then we need to add it to the list
          return [
            ...features,
            {
              ...activeData.feature,
              groupId: overId,
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
                    createNewGroup()
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
              {/* context for groups */}
              {/* // TODO: improve the way you pass the features  maybe with a dict*/}
              <SortableContext
                items={groupIds}
                strategy={verticalListSortingStrategy}
              >
                {groups.map((g) => (
                  <FeatureGroup
                    key={g.id}
                    deleteGroup={deleteGroup}
                    updateGroup={updateGroup}
                    group={g}
                  >
                    {features.filter((feature) => feature.groupId === g.id)
                      .length === 0 ? (
                      <div className="h-full px-3">
                        <FeatureGroupEmptyPlaceholder />
                      </div>
                    ) : (
                      <ScrollArea className="h-full px-3">
                        <SortableContext
                          items={features
                            .filter((feature) => feature.groupId === g.id)
                            .map((f) => f.id)}
                        >
                          <div className="space-y-2">
                            {features
                              .filter((feature) => feature.groupId === g.id)
                              .map((feature) => (
                                <SortableFeature
                                  deleteFeature={deleteFeature}
                                  key={feature.id}
                                  feature={feature}
                                />
                              ))}
                          </div>
                        </SortableContext>
                      </ScrollArea>
                    )}
                  </FeatureGroup>
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
