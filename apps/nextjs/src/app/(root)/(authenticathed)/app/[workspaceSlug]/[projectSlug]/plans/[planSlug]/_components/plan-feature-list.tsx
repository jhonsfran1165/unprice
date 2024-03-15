"use client"

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { FileStack } from "lucide-react"

import type { PlanVersionFeature } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import { ScrollArea } from "@builderai/ui/scroll-area"

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DroppableContainer } from "./droppable"
import { FeatureDialog } from "./feature-dialog"
import { SortableFeature } from "./sortable-feature"

interface PlanFeatureListProps {
  features: PlanVersionFeature[]
  id: string
}

export function PlanFeatureList({ features, id }: PlanFeatureListProps) {
  return (
    <ScrollArea className="h-[750px] pb-4">
      <div className="flex flex-col gap-2 p-4 pt-0">
        <DroppableContainer id={id}>
          <SortableContext
            items={features.map((feature) => feature.id)}
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
                  <FeatureDialog>
                    <Button>Create feature</Button>
                  </FeatureDialog>
                </EmptyPlaceholder.Action>
              </EmptyPlaceholder>
            ) : (
              <div className="space-y-2">
                {features.map((feature, i) => (
                  <SortableFeature
                    key={i}
                    mode="FeaturePlan"
                    feature={feature}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DroppableContainer>
      </div>
    </ScrollArea>
  )
}
