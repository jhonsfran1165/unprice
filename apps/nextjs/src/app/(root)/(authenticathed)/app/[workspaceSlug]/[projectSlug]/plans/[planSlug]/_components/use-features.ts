import { atom, useAtom } from "jotai"

import type { PlanVersionFeature } from "@builderai/db/validators"

const configActiveFeatureAtom = atom<PlanVersionFeature | null>(null)

export function useActiveFeature() {
  return useAtom(configActiveFeatureAtom)
}

const configSelectedFeedAtom = atom<PlanVersionFeature[]>([])

export function useSelectedFeatures() {
  return useAtom(configSelectedFeedAtom)
}
