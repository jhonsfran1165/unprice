import { atom, useAtom } from "jotai"

import type { PlanVersionFeature } from "@builderai/db/validators"

import { features, mails } from "./data"

interface Config {
  selected: PlanVersionFeature["id"] | null
}

const configAtom = atom<Config>({
  selected: mails[0].id,
})

export function useMail() {
  return useAtom(configAtom)
}

const configActiveFeatureAtom = atom<PlanVersionFeature | null>(null)

export function useActiveFeature() {
  return useAtom(configActiveFeatureAtom)
}

const configSelectedFeedAtom = atom<PlanVersionFeature[]>(features)

export function useSelectedFeatures() {
  return useAtom(configSelectedFeedAtom)
}
