import { getSession } from "@unprice/auth/server-rsc"
import { COOKIES_APP } from "@unprice/config"
import { dedupe, flag } from "flags/next"
import { cookies } from "next/headers"
import { unprice } from "./unprice"

export type UserEntitlement = {
  featureSlug: string
  validTo: number | null
  validFrom: number
  featureType: "flat" | "usage" | "tier" | "package"
}

const identify = dedupe(
  async (): Promise<{
    isMain: boolean
    entitlements: UserEntitlement[]
  }> => {
    const session = await getSession()

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
  }
)

export async function entitlementFlag(key: string) {
  const flagEntitlement = flag<
    boolean,
    {
      isMain: boolean
      entitlements: UserEntitlement[]
    }
  >({
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
