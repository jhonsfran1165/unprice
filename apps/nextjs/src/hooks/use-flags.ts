import { atom, useAtom } from "jotai"

export const flagsAtom = atom<{
  entitlements: {
    [x: string]: boolean
  }[]
  isMain: boolean
}>({
  entitlements: [],
  isMain: false,
})

export function useFlags(featureSlug: string): boolean {
  const [data] = useAtom(flagsAtom)
  const { isMain, entitlements } = data

  if (isMain) {
    return true
  }

  const entitlement = entitlements.find((entitlement) => entitlement[featureSlug])

  if (!entitlement) {
    return false
  }

  return true
}
