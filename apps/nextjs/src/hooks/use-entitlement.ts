import type { RouterOutputs } from "@unprice/trpc"
import { atom, useAtom } from "jotai"

export const entitlementsAtom = atom<{
  entitlements: RouterOutputs["customers"]["entitlements"]["entitlements"]
  isInternal: boolean
}>({
  entitlements: [],
  isInternal: false,
})

export function useEntitlement(featureSlug: string): {
  access: boolean
  remaining: number | null
} {
  const [data] = useAtom(entitlementsAtom)
  const { isInternal, entitlements } = data

  if (isInternal) {
    return { access: true, remaining: Number.POSITIVE_INFINITY }
  }

  const entitlement = entitlements.find((entitlement) => entitlement.featureSlug === featureSlug)

  if (!entitlement) {
    return { access: false, remaining: null }
  }

  // the entitlement has different types of statuses
  // we need to check the status of the entitlement
  // and return the correct boolean value
  switch (entitlement.featureType) {
    case "flat": {
      return { access: true, remaining: Number.POSITIVE_INFINITY }
    }
    case "usage":
    case "tier":
    case "package": {
      const currentUsage = entitlement.usage ?? 0
      const units = entitlement.units
      const limit = entitlement.limit

      // remaining usage given the units the user bought
      const remainingUsage = units ? units - currentUsage : undefined
      const remainingToLimit = limit ? limit - currentUsage : undefined

      return {
        access: !(remainingToLimit && remainingToLimit <= 0),
        remaining: remainingUsage ?? 0,
      }
    }

    default:
      return { access: false, remaining: null }
  }
}
