import { getSession } from "@unprice/auth/server-rsc"
import { COOKIES_APP } from "@unprice/config"
import { dedupe, flag } from "flags/next"
import { cookies } from "next/headers"
import { unprice } from "./unprice"

export type UserEntitlement = NonNullable<
  Awaited<ReturnType<typeof unprice.customers.getEntitlements>>["result"]
>["entitlements"][number]

export type UserIdentity = {
  isMain: boolean
  entitlements: UserEntitlement[]
  customerId: string
}

const identify = dedupe(async (): Promise<UserIdentity> => {
  const session = await getSession()

  const workspaceSlug = cookies().get(COOKIES_APP.WORKSPACE)?.value

  const currentWorkspace = session?.user.workspaces.find((w) => w.slug === workspaceSlug)

  if (!currentWorkspace || currentWorkspace.isMain) {
    return {
      isMain: currentWorkspace?.isMain ?? false,
      entitlements: [],
      customerId: currentWorkspace?.unPriceCustomerId ?? "",
    }
  }

  const { result } = await unprice.customers.getEntitlements(currentWorkspace.unPriceCustomerId)

  if (!result) {
    return {
      isMain: currentWorkspace.isMain,
      entitlements: [],
      customerId: currentWorkspace.unPriceCustomerId,
    }
  }

  return {
    isMain: currentWorkspace.isMain,
    entitlements: result.entitlements,
    customerId: currentWorkspace.unPriceCustomerId,
  }
})

export async function entitlementFlag(key: string) {
  const flagEntitlement = flag<boolean, UserIdentity>({
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
