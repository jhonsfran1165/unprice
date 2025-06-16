"use client"

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useHydrateAtoms } from "jotai/utils"
import { FileStack, Search } from "lucide-react"
import { useState } from "react"

import type { RouterOutputs } from "@unprice/trpc"
import { Input } from "@unprice/ui/input"
import { Separator } from "@unprice/ui/separator"

import { Typography } from "@unprice/ui/typography"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import {
  configActivePlanAtom,
  configActivePlanVersionAtom,
  configPlanFeaturesListAtom,
  usePlanFeaturesList,
} from "~/hooks/use-features"
import { DroppableContainer } from "../../_components/droppable"
import { SortableFeature } from "../../_components/sortable-feature"

interface PlanFeatureListProps {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}

export function PlanFeatureList({ planVersion }: PlanFeatureListProps) {
  const [filter, setFilter] = useState("")

  if (!planVersion) return null

  const { planFeatures, plan, ...activePlanVersion } = planVersion

  // hydrate atoms with initial data
  // TODO: this atoms should be refetch when the planVersion changes
  useHydrateAtoms([[configPlanFeaturesListAtom, planFeatures]])
  useHydrateAtoms([[configActivePlanVersionAtom, activePlanVersion]])
  useHydrateAtoms([[configActivePlanAtom, plan]])

  const [featuresList] = usePlanFeaturesList()

  const filteredFeatures =
    featuresList.filter((feature) =>
      feature.feature.title.toLowerCase().includes(filter.toLowerCase())
    ) ?? featuresList

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[70px] items-center justify-between space-x-1 px-4 py-2">
        <Typography variant="h4">Features on this version</Typography>
      </div>
      <Separator />
      <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search feature in plan"
            className="pl-8"
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="flex h-min-[750px] flex-col gap-2 p-4 pt-1">
        <DroppableContainer id={"planVersionFeaturesList"}>
          <SortableContext
            items={featuresList.map((feature) => feature.featureId)}
            strategy={verticalListSortingStrategy}
          >
            {filteredFeatures.length === 0 ? (
              <EmptyPlaceholder className="h-[725px]">
                <EmptyPlaceholder.Icon>
                  <FileStack className="h-8 w-8" />
                </EmptyPlaceholder.Icon>
                <EmptyPlaceholder.Title>No features</EmptyPlaceholder.Title>
                <EmptyPlaceholder.Description>
                  Once you create a feature, you can add it to the plan version.
                  <br />
                  Drag and drop it here.
                </EmptyPlaceholder.Description>
              </EmptyPlaceholder>
            ) : (
              <div className="space-y-2">
                {filteredFeatures.map((feature) => (
                  <SortableFeature
                    disabled={activePlanVersion?.status === "published"}
                    key={feature.featureId}
                    mode="FeaturePlan"
                    planFeatureVersion={feature}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DroppableContainer>
      </div>
    </div>
  )
}
