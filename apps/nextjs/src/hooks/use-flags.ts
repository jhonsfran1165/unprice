import { atom, useAtom } from "jotai"

export const flagsAtom = atom<{
  entitlements: {
    [x: string]: boolean
  }[]
  isMain: boolean
  customerId: string
}>({
  entitlements: [],
  isMain: false,
  customerId: "",
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

export function useCustomerId(): string {
  const [data] = useAtom(flagsAtom)
  const { customerId } = data

  return customerId
}

export function useIsMain(): boolean {
  const [data] = useAtom(flagsAtom)
  const { isMain } = data

  return isMain
}

export function useEntitlements(): {
  [x: string]: boolean
}[] {
  const [data] = useAtom(flagsAtom)
  const { entitlements } = data

  return entitlements
}
