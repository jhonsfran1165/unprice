"use client"

import { useState } from "react"
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
import { createPortal } from "react-dom"

import type { PlanVersionFeatureDragDrop } from "@builderai/db/validators"

import { FeaturePlan } from "./feature-plan"
import { useActiveFeature, usePlanFeaturesList } from "./use-features"

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
  const [planFeaturesList, setPlanFeaturesList] = usePlanFeaturesList()
  // TODO: use this to get the order of the groups
  // const groupIds = useMemo(() => groups.map((g) => g.id), [groups])
  const [activeFeature, setActiveFeature] = useActiveFeature()

  const [clonedFeatures, setClonedFeatures] = useState<
    PlanVersionFeatureDragDrop[] | null
  >(null)

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
      setClonedFeatures(planFeaturesList)
    }

    setClonedFeatures(null)
  }

  const onDragStart = (event: DragStartEvent) => {
    // just copy the features in case the user cancels the drag
    setClonedFeatures(planFeaturesList)

    if (
      ["Feature", "FeaturePlan"].includes(
        event.active.data.current?.mode as string
      )
    ) {
      setActiveFeature(
        event.active.data.current
          ?.planFeatureVersion as PlanVersionFeatureDragDrop
      )

      // // if the feature is already created we don't need to create it again
      // if (!planFeatureVersion.id) {
      //   // optimistic update :)
      //   onDragFeature(planFeatureVersion)
      // }
      return
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveFeature(null)
    setClonedFeatures(null)

    const { active, over } = event

    // only process if there is an over item
    if (!over) return

    // over represents the item that is being dragged over
    // active represents the item that is being dragged
    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    console.log("onDragOver", { active }, { over })

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

    const isOverAFeaturePlan = overData?.mode === "FeaturePlan"
    const isActiveAFeature = activeData?.mode === "Feature"

    const planFeatureVersion =
      activeData.planFeatureVersion as PlanVersionFeatureDragDrop

    // look for the index of the active feature
    const activeIndex = planFeaturesList.findIndex(
      (t) => t.featureId === activeId
    )
    const activeFeature = planFeaturesList[activeIndex]

    setPlanFeaturesList((featuresList) => {
      const features = featuresList
      // I'm dropping a Feature over another Feature
      if (isOverAFeaturePlan || isActiveAFeature) {
        const overIndex = features.findIndex((t) => t.featureId === overId)
        // if the active feature is not in the list we add it
        const result = activeFeature
          ? arrayMove(features, activeIndex, overIndex)
          : arrayMove([...features, planFeatureVersion], activeIndex, overIndex)

        return result
      } else {
        // I'm dropping a Feature over the drop area
        const result = activeFeature
          ? arrayMove(features, activeIndex, activeIndex)
          : [...features, planFeatureVersion]

        return result
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
              <FeaturePlan
                mode={"FeaturePlan"}
                planFeatureVersion={activeFeature}
              />
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  )
}
