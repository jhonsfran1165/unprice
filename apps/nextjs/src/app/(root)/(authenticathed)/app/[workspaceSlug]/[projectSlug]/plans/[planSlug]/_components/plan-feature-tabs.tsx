"use client"

import { useHydrateAtoms } from "jotai/utils"

import { Separator } from "@builderai/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { PlanFeatureList } from "./plan-feature-list"
import type { PlanFeaturesList } from "./use-features"
import {
  configPlanFeaturesListAtom,
  useActiveFeature,
  usePlanActiveTab,
} from "./use-features"

interface PlanFeatureTabsProps {
  initialFeatures: PlanFeaturesList
}

export function PlanFeatureTabs({ initialFeatures }: PlanFeatureTabsProps) {
  // hydrate atoms with initial data
  useHydrateAtoms([[configPlanFeaturesListAtom, initialFeatures]])
  const [planActiveTab, setPlanActiveTab] = usePlanActiveTab()
  const [_activeFeature, setActiveFeature] = useActiveFeature()

  return (
    <Tabs value={planActiveTab}>
      <div className="flex items-center px-4 py-2">
        <h1 className="truncate text-xl font-bold">Features on this plan</h1>
        <TabsList className="ml-auto">
          <TabsTrigger
            value="planFeatures"
            className="text-zinc-600 dark:text-zinc-200 "
            onClick={() => {
              setPlanActiveTab("planFeatures")
              setActiveFeature(null)
            }}
          >
            features
          </TabsTrigger>
          <TabsTrigger
            value="planAddons"
            className="text-zinc-600 dark:text-zinc-200"
            onClick={() => {
              setPlanActiveTab("planAddons")
              setActiveFeature(null)
            }}
          >
            addons
          </TabsTrigger>
        </TabsList>
      </div>
      <Separator />

      <TabsContent value="planFeatures" className="m-0">
        <PlanFeatureList id={"planFeatures"} />
      </TabsContent>
      <TabsContent value="planAddons" className="m-0">
        <PlanFeatureList id={"planAddons"} />
      </TabsContent>
    </Tabs>
  )
}
