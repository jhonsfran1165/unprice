"use client"

import { useState } from "react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useHydrateAtoms } from "jotai/utils"
import { FileStack, Search } from "lucide-react"

import { Button } from "@builderai/ui/button"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DroppableContainer } from "../../_components/droppable"
import { FeatureDialog } from "../../_components/feature-dialog"
import { SortableFeature } from "../../_components/sortable-feature"
import type { PlanFeaturesList } from "../../_components/use-features"
import {
  configPlanFeaturesListAtom,
  usePlanFeaturesListActive,
} from "../../_components/use-features"

interface PlanFeatureListProps {
  initialFeatures: PlanFeaturesList
}

export function PlanFeatureList({ initialFeatures }: PlanFeatureListProps) {
  const [filter, setFilter] = useState("")

  // hydrate atoms with initial data
  useHydrateAtoms([[configPlanFeaturesListAtom, initialFeatures]])
  const features = usePlanFeaturesListActive()

  const filteredFeatures = features.filter((feature) =>
    feature.title.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <>
      <div className="flex h-[52px] items-center justify-between space-x-1 px-4 py-2">
        <h1 className="truncate text-xl font-bold">Features on this plan</h1>
      </div>
      <Separator />
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feature in plan"
            className="pl-8"
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="h-[750px] pb-4">
        <div className="flex flex-col gap-2 p-4 pt-0">
          <DroppableContainer id={"featuresConfig"}>
            <SortableContext
              items={features.map((feature) => feature.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredFeatures.length === 0 ? (
                <EmptyPlaceholder>
                  <EmptyPlaceholder.Icon>
                    <FileStack className="h-8 w-8" />
                  </EmptyPlaceholder.Icon>
                  <EmptyPlaceholder.Title>No features</EmptyPlaceholder.Title>
                  <EmptyPlaceholder.Description>
                    Create feature and drag it here
                  </EmptyPlaceholder.Description>
                  <EmptyPlaceholder.Action>
                    <FeatureDialog
                      defaultValues={{
                        title: filter,
                        slug: filter,
                        description: "",
                      }}
                    >
                      <Button>Create feature</Button>
                    </FeatureDialog>
                  </EmptyPlaceholder.Action>
                </EmptyPlaceholder>
              ) : (
                <div className="space-y-2">
                  {filteredFeatures.map((feature, i) => (
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
    </>
  )
}
