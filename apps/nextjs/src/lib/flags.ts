import { auth } from "@unprice/auth/server"
import { COOKIES_APP } from "@unprice/config"
import { dedupe, flag } from "flags/next"
import { cookies } from "next/headers"
import { unprice } from "./unprice"

export type UserEntitlement = {
  isMain: boolean
  entitlements: {
    featureSlug: string
    validTo: number | null
    validFrom: number
  }[]
}

const identify = dedupe(async (): Promise<UserEntitlement> => {
  const session = await auth()

  const workspaceSlug = cookies().get(COOKIES_APP.WORKSPACE)?.value

  const currentWorkspace = session?.user.workspaces.find((w) => w.slug === workspaceSlug)

  if (!currentWorkspace || currentWorkspace.isMain) {
    return {
      isMain: currentWorkspace?.isMain ?? false,
      entitlements: [],
    }
  }

  const { result } = await unprice.customers.getEntitlements(currentWorkspace.unPriceCustomerId)

  if (!result) {
    return {
      isMain: currentWorkspace.isMain,
      entitlements: [],
    }
  }

  return {
    isMain: currentWorkspace.isMain,
    entitlements: result.entitlements,
  }
})

export async function entitlementFlag(key: string) {
  const flagEntitlement = flag<boolean, UserEntitlement>({
    key,
    identify,
    decide({ entities }) {
      // if main workspace always return true
      if (entities?.isMain) {
        return true
      }

      // If no override, use the entitlements logic
      return entities?.entitlements.some((entitlement) => entitlement.featureSlug === key) ?? false
    },
    defaultValue: false,
  })

  return flagEntitlement()
}
