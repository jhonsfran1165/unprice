import { atom, useAtom } from "jotai"

import type { PlanVersionFeature } from "@builderai/db/validators"

const configActiveFeatureAtom = atom<PlanVersionFeature | null>(null)

export function useActiveFeature() {
  return useAtom(configActiveFeatureAtom)
}

export interface PlanFeaturesList {
  planFeatures: PlanVersionFeature[]
}

export const configPlanFeaturesListAtom = atom<PlanFeaturesList>({
  planFeatures: [],
})

const configPlanActiveTabAtom = atom<"planFeatures">("planFeatures")

export function usePlanActiveTab() {
  return useAtom(configPlanActiveTabAtom)
}

export function usePlanFeaturesList() {
  return useAtom(configPlanFeaturesListAtom)
}

export function usePlanFeaturesListActive() {
  const [featuresList] = usePlanFeaturesList()
  const [planActiveTab] = usePlanActiveTab()

  return featuresList[planActiveTab] || []
}
