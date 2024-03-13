import { atom, useAtom } from "jotai"

import type { PlanVersionFeature } from "@builderai/db/validators"

import { mails } from "./data"

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

const configSelectedFeedAtom = atom<PlanVersionFeature[]>([])

export function useSelectedFeatures() {
  return useAtom(configSelectedFeedAtom)
}
