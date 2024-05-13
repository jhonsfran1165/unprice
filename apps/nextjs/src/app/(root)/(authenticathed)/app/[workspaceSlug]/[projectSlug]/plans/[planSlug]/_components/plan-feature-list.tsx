"use client"

import { useState } from "react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useHydrateAtoms } from "jotai/utils"
import { ChevronRight, FileStack, Search } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DroppableContainer } from "../../_components/droppable"
import { FeatureDialog } from "../../_components/feature-dialog"
import { SortableFeature } from "../../_components/sortable-feature"
import {
  configActivePlanAtom,
  configActivePlanVersionAtom,
  configPlanFeaturesListAtom,
  usePlanFeaturesList,
  usePlanVersionFeatureOpen,
} from "../../_components/use-features"

interface PlanFeatureListProps {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}

export function PlanFeatureList({ planVersion }: PlanFeatureListProps) {
  const [filter, setFilter] = useState("")

  const { planFeatures, plan, ...activePlanVersion } = planVersion

  // hydrate atoms with initial data
  // TODO: this atoms should be refetch when the planVersion changes
  useHydrateAtoms([[configPlanFeaturesListAtom, planFeatures]])
  useHydrateAtoms([[configActivePlanVersionAtom, activePlanVersion]])
  useHydrateAtoms([[configActivePlanAtom, plan]])

  const [featuresList] = usePlanFeaturesList()
  // this avoid to drag and drop features when the planVersionFeature is open
  const [planVersionFeatureOpen] = usePlanVersionFeatureOpen()

  const filteredFeatures =
    featuresList.filter((feature) =>
      feature.feature.title.toLowerCase().includes(filter.toLowerCase())
    ) ?? featuresList

  return (
    <div className="flex flex-col">
      <div className="flex h-[70px] items-center justify-between space-x-1 px-4 py-2">
        <h1 className="truncate text-xl font-bold">Features on this version</h1>
        <Button size={"sm"}>
          addons
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
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
          <DroppableContainer id={"planVersionFeaturesList"}>
            <SortableContext
              items={featuresList.map((feature) => feature.featureId)}
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
                      <Button size={"sm"}>Create feature</Button>
                    </FeatureDialog>
                  </EmptyPlaceholder.Action>
                </EmptyPlaceholder>
              ) : (
                <div className="space-y-2">
                  {filteredFeatures.map((feature, i) => (
                    <SortableFeature
                      disabled={planVersionFeatureOpen}
                      key={i}
                      mode="FeaturePlan"
                      planFeatureVersion={feature}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </DroppableContainer>
        </div>
      </ScrollArea>
    </div>
  )
}
