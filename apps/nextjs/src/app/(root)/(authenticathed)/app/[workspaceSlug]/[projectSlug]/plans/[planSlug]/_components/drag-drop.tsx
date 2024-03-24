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
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { TRPCClientError } from "@trpc/client"
import { createPortal } from "react-dom"

import type { PlanVersionFeature } from "@builderai/db/validators"
import { useToast } from "@builderai/ui/use-toast"

import { api } from "~/trpc/client"
import { FeaturePlan } from "./feature-plan"
import { usePlanActiveTab, usePlanFeaturesList } from "./use-features"

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
export default function DragDrop({ children }: { children: React.ReactNode }) {
  const toaster = useToast()
  const [planActiveTab] = usePlanActiveTab()

  const [featuresList, setFeatures] = usePlanFeaturesList()

  const features = featuresList[planActiveTab]

  const [activeFeature, setActiveFeature] = useState<PlanVersionFeature | null>(
    null
  )
  const [clonedFeatures, setClonedFeatures] = useState<
    PlanVersionFeature[] | null
  >(null)

  const featuresIds = useMemo(() => {
    return features.map((feature) => feature.id)
  }, [features])

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

  const onDragStart = (event: DragStartEvent) => {
    // just copy the features in case the user cancels the drag
    setClonedFeatures(features)

    if (
      ["Feature", "FeaturePlan"].includes(
        event.active.data.current?.mode as string
      )
    ) {
      setActiveFeature(event.active.data.current?.feature as PlanVersionFeature)
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

    if (!activeData) return

    const isOverAFeature = overData?.mode === "FeaturePlan"

    // look for the index of the active feature
    const activeIndex = features.findIndex((t) => t.id === activeId)
    const activeFeature = features[activeIndex]

    setFeatures((featureList) => {
      const features = featureList[planActiveTab]
      // I'm dropping a Feature over another Feature
      if (isOverAFeature) {
        const overIndex = features.findIndex((t) => t.id === overId)
        // if the active feature is not in the list we add it
        const result = activeFeature
          ? arrayMove(features, activeIndex, overIndex)
          : arrayMove(
              [...features, activeData.feature] as PlanVersionFeature[],
              activeIndex,
              overIndex
            )

        return {
          ...featureList,
          [planActiveTab]: result,
        }
      } else {
        // I'm dropping a Feature over the drop area
        const result = activeFeature
          ? arrayMove(features, activeIndex, activeIndex)
          : ([...features, activeData.feature] as PlanVersionFeature[])

        return {
          ...featureList,
          [planActiveTab]: result,
        }
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
      {children}
      {typeof window !== "undefined" &&
        "document" in window &&
        createPortal(
          <DragOverlay adjustScale={false} dropAnimation={dropAnimation}>
            {activeFeature && (
              <FeaturePlan mode={"FeaturePlan"} feature={activeFeature} />
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  )
}
