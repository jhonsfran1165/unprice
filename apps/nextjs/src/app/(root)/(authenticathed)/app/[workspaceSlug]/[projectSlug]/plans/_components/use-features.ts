import { atom, useAtom } from "jotai"

import type { PlanVersionFeatureDragDrop } from "@builderai/db/validators"

const configActiveFeatureAtom = atom<PlanVersionFeatureDragDrop | null>(null)

export function useActiveFeature() {
  return useAtom(configActiveFeatureAtom)
}

export const configPlanFeaturesListAtom = atom<PlanVersionFeatureDragDrop[]>([])

export function usePlanFeaturesList() {
  return useAtom(configPlanFeaturesListAtom)
}
