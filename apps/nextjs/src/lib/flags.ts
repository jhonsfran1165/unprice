import { Unprice } from "@unprice/api"

import { dedupe, flag } from "flags/next"

import { env } from "#env"

import type { ReadonlyRequestCookies } from "flags"

export const unprice = new Unprice({
  token: env.UNPRICE_API_KEY,
})

export type UserEntitlement = {
  customerId: string
  entitlements: {
    slug: string
    validUntil: number
    validFrom: number
  }[]
}

const identify = dedupe(
  async ({ cookies }: { cookies: ReadonlyRequestCookies }): Promise<UserEntitlement> => {
    const customerId = cookies.get("unPriceCustomerId")?.value
    const { result, error } = await unprice.customers.getEntitlements(customerId ?? "")

    if (error) {
      return { customerId: customerId ?? "", entitlements: [] }
    }

    return {
      customerId: customerId ?? "",
      entitlements: result.entitlements as UserEntitlement["entitlements"],
    }
  }
)

export const entitlementsFlag = flag<boolean, UserEntitlement>({
  key: "entitlements",
  description: "An example feature flag",
  identify,
  decide({ entities }) {
    return entities?.entitlements.some((entitlement) => entitlement.slug === "beta") ?? false
  },
  defaultValue: false,
})
