import { atom, useAtom } from "jotai"

import type { Plan, PlanVersion, PlanVersionFeatureDragDrop } from "@builderai/db/validators"

const configActiveFeatureAtom = atom<PlanVersionFeatureDragDrop | null>(null)

export function useActiveFeature() {
  return useAtom(configActiveFeatureAtom)
}

const configPlanVersionFeatureOpenAtom = atom<boolean>(false)

export function usePlanVersionFeatureOpen() {
  return useAtom(configPlanVersionFeatureOpenAtom)
}

export const configPlanFeaturesListAtom = atom<PlanVersionFeatureDragDrop[]>([])
export const configActivePlanVersionAtom = atom<PlanVersion | null>(null)
export const configActivePlanAtom = atom<Plan | null>(null)

export function usePlanFeaturesList() {
  return useAtom(configPlanFeaturesListAtom)
}

export function useActivePlanVersion() {
  return useAtom(configActivePlanVersionAtom)
}

export function useActivePlan() {
  return useAtom(configActivePlanAtom)
}
