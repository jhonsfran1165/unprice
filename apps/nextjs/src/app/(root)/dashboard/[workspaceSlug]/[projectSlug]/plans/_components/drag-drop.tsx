"use client"

import type { DragEndEvent, DragOverEvent, DragStartEvent, DropAnimation } from "@dnd-kit/core"
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useRouter } from "next/navigation"
import { startTransition, useState } from "react"
import { createPortal } from "react-dom"

import { useMutation } from "@tanstack/react-query"
import type { PlanVersionFeatureDragDrop } from "@unprice/db/validators"
import { useActiveFeature, useActivePlanVersion, usePlanFeaturesList } from "~/hooks/use-features"
import { toastAction } from "~/lib/toast"
import { useTRPC } from "~/trpc/client"
import { FeaturePlan } from "./feature-plan"

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
  const [clonedFeatures, setClonedFeatures] = useState<PlanVersionFeatureDragDrop[] | null>(null)
  const router = useRouter()
  const [activeFeature, setActiveFeature] = useActiveFeature()
  const [planFeaturesList, setPlanFeaturesList] = usePlanFeaturesList()
  const [activePlanVersion] = useActivePlanVersion()
  const isPublished = activePlanVersion?.status === "published"
  const trpc = useTRPC()

  const updatePlanVersionFeatures = useMutation(
    trpc.planVersionFeatures.update.mutationOptions({
      onSuccess: () => {
        router.refresh()
      },
    })
  )

  // TODO: when this takes too long we should show a loading state
  const createPlanVersionFeatures = useMutation(
    trpc.planVersionFeatures.create.mutationOptions({
      onSuccess: ({ planVersionFeature }) => {
        // Update the entire features list to maintain consistency with drag-drop
        setPlanFeaturesList((features) => {
          return features.map((feature) =>
            feature.featureId === planVersionFeature.featureId
              ? { ...feature, ...planVersionFeature }
              : feature
          )
        })
      },
      // Optionally add optimistic updates
      onMutate: (planVersionFeature) => {
        const previousFeatures = planFeaturesList

        setPlanFeaturesList((features) =>
          features.map((feature) =>
            feature.featureId === planVersionFeature.featureId
              ? { ...feature, ...planVersionFeature }
              : feature
          )
        )

        return { previousFeatures }
      },
      onError: (_, __, context) => {
        // Rollback on error
        if (context?.previousFeatures) {
          setPlanFeaturesList(context.previousFeatures)
        } else {
          setPlanFeaturesList(clonedFeatures ?? [])
        }
      },
    })
  )

  function onChanges(planFeatureVersion: PlanVersionFeatureDragDrop) {
    startTransition(() => {
      // look for the index of the active feature to see if it is already in the list
      const activeIndex = planFeaturesList.findIndex(
        (t) => t.featureId === planFeatureVersion.featureId
      )
      const previousIndex = planFeaturesList[activeIndex - 1]
      const nextIndex = planFeaturesList[activeIndex + 1]

      // we are calculating the order of the feature based on the previous and next feature
      // we average those two numbers to get the order of the feature
      // we give a default value of 1024 so there is always a space between the features
      // this approach avoids the need to update all the features when we reorder them
      if (!previousIndex && nextIndex) {
        // if the feature is the first one in the list
        planFeatureVersion.order = nextIndex.order / 2
      } else if (previousIndex && !nextIndex) {
        // if the feature is the last one in the list
        planFeatureVersion.order = previousIndex.order + 1024
      } else if (previousIndex && nextIndex) {
        // if the feature is in the middle of the list
        planFeatureVersion.order = (previousIndex.order + nextIndex.order) / 2
      } else {
        // if the feature is the only one in the list
        planFeatureVersion.order = 1024
      }

      if (!planFeatureVersion.id) {
        // create a new plan feature
        void createPlanVersionFeatures.mutateAsync({ ...planFeatureVersion })
      } else {
        const clonedOrderFeatures = clonedFeatures?.filter((f) => f.id).map((t) => t.order) ?? []

        const currentOrderFeatures = planFeaturesList.filter((f) => f.id).map((t) => t.order) ?? []

        // if the order of the features is the same we don't need to update
        if (clonedOrderFeatures.toString() === currentOrderFeatures.toString()) {
          return
        }

        // update the order of the feature
        void updatePlanVersionFeatures.mutateAsync({
          id: planFeatureVersion.id,
          planVersionId: planFeatureVersion.planVersionId,
          order: planFeatureVersion.order,
        })
      }
    })
  }

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

  const onDragEnd = (event: DragEndEvent) => {
    const { active } = event
    const activeData = active.data.current

    if (isPublished) {
      return
    }

    if (!activeData) return

    const planFeatureVersion = activeData.planFeatureVersion as PlanVersionFeatureDragDrop

    onChanges(planFeatureVersion)

    setClonedFeatures(null)
  }

  const onDragCancel = () => {
    if (clonedFeatures) {
      // Reset items to their original state in case items have been
      setClonedFeatures(planFeaturesList)
    }

    setClonedFeatures(null)
  }

  const onDragStart = (event: DragStartEvent) => {
    if (isPublished) {
      toastAction(
        "error",
        "You cannot add features to a published plan version. Please create a new version or duplicate the current one."
      )
      return
    }

    // just copy the features in case the user cancels the drag
    setClonedFeatures(planFeaturesList)

    if (["Feature", "FeaturePlan"].includes(event.active.data.current?.mode as string)) {
      setActiveFeature(event.active.data.current?.planFeatureVersion as PlanVersionFeatureDragDrop)

      return
    }
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (isPublished) {
      return
    }

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

    // FeaturePlan represents a feature that is already inside the plan version list
    const isOverAFeaturePlan = overData?.mode === "FeaturePlan"
    // Feature represents a feature inside the feature list
    const isActiveAFeature = activeData?.mode === "Feature"

    const planFeatureVersion = activeData.planFeatureVersion as PlanVersionFeatureDragDrop

    // look for the index of the active feature to see if it is already in the list
    const activeIndex = planFeaturesList.findIndex((t) => t.featureId === activeId)
    const activeFeatureInList = planFeaturesList[activeIndex]

    // set the new list of features given the new order
    setPlanFeaturesList((featuresList) => {
      const features = featuresList
      // I'm dropping a Feature over another Feature
      if (isOverAFeaturePlan || isActiveAFeature) {
        // check the index of the feature that is being dragged over
        const overIndex = features.findIndex((t) => t.featureId === overId)
        // if the active feature is not in the list we add it
        // otherwise we just reorder the list
        const result = activeFeatureInList
          ? arrayMove(features, activeIndex, overIndex)
          : arrayMove([...features, planFeatureVersion], activeIndex, overIndex)

        return result
      }
      // I'm dropping a Feature over the drop area
      // if the active feature is not in the list we add it
      // otherwise we just reorder the list
      const result = activeFeatureInList
        ? arrayMove(features, activeIndex, activeIndex)
        : [...features, planFeatureVersion]

      return result
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
              <FeaturePlan mode={"FeaturePlan"} planFeatureVersion={activeFeature} />
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  )
}
