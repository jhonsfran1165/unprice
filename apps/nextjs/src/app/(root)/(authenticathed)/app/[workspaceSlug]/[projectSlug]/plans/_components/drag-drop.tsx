"use client"

import { useCallback, useMemo, useRef, useState } from "react"
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
import { TRPCClientError } from "@trpc/client"
import { createPortal } from "react-dom"

import type { RouterOutputs } from "@builderai/api"
import type { FeatureType, PlanVersionFeature } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import { Add, FileStack } from "@builderai/ui/icons"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@builderai/ui/resizable"
import { Separator } from "@builderai/ui/separator"
import { useToast } from "@builderai/ui/use-toast"

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { api } from "~/trpc/client"
import { DroppableContainer } from "./droppable"
import { FeatureCard } from "./feature"
import { Features } from "./features"
import { SortableFeature } from "./sortable-feature"

function generateId() {
  // generate a random id
  return Math.random().toString(36).substr(2, 9)
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
}

// TODO: do not pass projectSlug to different components - props hell!!
export default function DragDrop({
  projectSlug,
  version,
}: {
  projectSlug: string
  version?: RouterOutputs["plans"]["getVersionById"]["planVersion"]
}) {
  const toaster = useToast()
  const wasBuilt = useRef(false)
  const disabled = version?.status === "published"

  const [activeFeature, setActiveFeature] = useState<PlanVersionFeature | null>(
    null
  )
  const [clonedFeatures, setClonedFeatures] = useState<
    PlanVersionFeature[] | null
  >(null)
  // store all the features in the current plan
  const [features, setFeatures] = useState<PlanVersionFeature[]>([])

  const featuresIds = useMemo(() => {
    return features.map((feature) => feature.id)
  }, [features])

  const reBuildDragAndDrop = useCallback(
    (features: PlanVersionFeature[]) => {
      try {
        setFeatures(features)

        return features
      } catch (error) {
        console.error("error", error)
        return [] as PlanVersionFeature[]
      }
    },

    []
  )

  const updatePlanVersion = api.plans.updateVersion.useMutation({
    onSuccess: () => {
      // setConfig([]) // clear the local storage
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Error updating plan",
          variant: "destructive",
          description:
            "An issue occurred while updating the plan. Please try again.",
        })
      }
    },
  })

  // sensor are the way we can control how the drag and drop works
  // we have some components inside the feature that are interactive like buttons
  // so we need to delay the drag and drop when the user clicks on those buttons
  // otherwise the drag and drop will start when the user clicks on the buttons
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
      setClonedFeatures(features)
    }

    setClonedFeatures(null)
  }

  const deleteFeature = (id: string) => {
    const newFeature = features.filter((feature) => feature.id !== id)
    setFeatures(newFeature)
  }

  const updateFeature = (feature: PlanVersionFeature) => {
    setFeatures((features) => {
      const index = features.findIndex((f) => f.id === feature.id)
      if (index === -1) return features

      features[index] = feature
      return [...features]
    })
  }

  const onDragStart = (event: DragStartEvent) => {
    // just copy the features in case the user cancels the drag
    setClonedFeatures(features)

    if (event.active.data.current?.type === "Feature") {
      setActiveFeature(event.active.data.current.feature as PlanVersionFeature)
      return
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveFeature(null)
    setClonedFeatures(null)

    const { active, over } = event

    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return
  }

  const onDragOver = (event: DragOverEvent) => {
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

    // only process features
    if (!isActiveFeature) return

    // look for the index of the active feature
    const activeIndex = features.findIndex((t) => t.id === activeId)
    const activeFeature = features[activeIndex]

    setFeatures((features) => {
      // I'm dropping a Feature over another Feature
      if (isOverAFeature) {
        const overIndex = features.findIndex((t) => t.id === overId)
        // if the active feature is not in the list we add it
        return activeFeature
          ? arrayMove(features, activeIndex, overIndex)
          : arrayMove(
              [...features, activeData.feature] as PlanVersionFeature[],
              activeIndex,
              overIndex
            )
      } else {
        // I'm dropping a Feature over the drop area
        return activeFeature
          ? arrayMove(features, activeIndex, activeIndex)
          : ([...features, activeData.feature] as PlanVersionFeature[])
      }
    })
  }

  return (
    <DndContext
      id={"plan-version-features"}
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
                    console.log("add feature")
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
          <div className="flex h-full flex-col px-4 py-4">
            <DroppableContainer id="1">
              <SortableContext
                items={features}
                strategy={verticalListSortingStrategy}
              >
                {features.length === 0 ? (
                  <EmptyPlaceholder>
                    <EmptyPlaceholder.Icon>
                      <FileStack className="h-8 w-8" />
                    </EmptyPlaceholder.Icon>
                    <EmptyPlaceholder.Title>
                      No features added yet
                    </EmptyPlaceholder.Title>
                    <EmptyPlaceholder.Description>
                      Create your first feature and drag it here
                    </EmptyPlaceholder.Description>
                    <EmptyPlaceholder.Action>
                      <Button size="sm" className="relative">
                        Add Feature
                      </Button>
                    </EmptyPlaceholder.Action>
                  </EmptyPlaceholder>
                ) : (
                  <div className="space-y-2">
                    {features.map((f) => (
                      <SortableFeature
                        projectSlug={projectSlug}
                        deleteFeature={deleteFeature}
                        updateFeature={updateFeature}
                        key={f.id}
                        feature={f}
                        type="Plan"
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DroppableContainer>
          </div>

          {typeof window !== "undefined" &&
            "document" in window &&
            createPortal(
              <DragOverlay adjustScale={false} dropAnimation={dropAnimation}>
                {activeFeature && (
                  <FeatureCard
                    isOverlay
                    feature={activeFeature}
                    projectSlug={projectSlug}
                    type="Feature"
                  />
                )}
              </DragOverlay>,
              document.body
            )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={20}>
          <Features
            selectedFeaturesIds={featuresIds}
            projectSlug={projectSlug}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </DndContext>
  )
}
