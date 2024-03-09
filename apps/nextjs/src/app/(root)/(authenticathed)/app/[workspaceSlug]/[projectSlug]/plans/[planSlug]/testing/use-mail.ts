import { atom, useAtom } from "jotai"

import type { PlanVersionFeature } from "@builderai/db/validators"

import type { Mail } from "./data"
import { features, mails } from "./data"

interface Config {
  selected: Mail["id"] | null
}

const configAtom = atom<Config>({
  selected: mails[0].id,
})

export function useMail() {
  return useAtom(configAtom)
}

const configSelectedFeedAtom = atom<PlanVersionFeature[]>(features)

export function useSelectedFeatures() {
  return useAtom(configSelectedFeedAtom)
}
