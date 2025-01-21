"use client"

import { api } from "~/trpc/client"

import type { Session } from "@unprice/auth/server"
import type { CustomerEntitlement } from "@unprice/db/validators"
import { useParams } from "next/navigation"
import type React from "react"
import { createContext, useContext } from "react"

const EntitlementContext = createContext({
  isInternal: false,
  entitlements: [] as Omit<CustomerEntitlement, "createdAtM" | "updatedAtM">[],
  isLoading: false,
})

export const EntitlementProvider = ({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) => {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string
  const workspaces = session?.user?.workspaces

  const workspace = workspaces?.find((workspace) => workspace.slug === workspaceSlug)
  const unPriceCustomerId = workspace?.unPriceCustomerId ?? ""

  const { data, isLoading: entitlementsLoading } = api.customers.entitlements.useQuery(
    {
      customerId: unPriceCustomerId,
      // pull from db instead of cache
      noCache: true,
    },
    {
      enabled: !!unPriceCustomerId && unPriceCustomerId !== "",
      // stale time for 10 minutes
      staleTime: 1000 * 60 * 10,
    }
  )

  return (
    <EntitlementContext.Provider
      value={{
        entitlements: data?.entitlements ?? [],
        isInternal: workspace?.isInternal ?? false,
        isLoading: entitlementsLoading,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  )
}

export const useEntitlements = () => {
  const context = useContext(EntitlementContext)
  if (!context) {
    throw new Error("useEntitlements must be used within an EntitlementProvider")
  }
  return context
}

export const useEntitlement = (
  featureSlug: string
): {
  access: boolean
  remaining: number | null
} => {
  const { entitlements, isInternal, isLoading } = useEntitlements()

  if (isInternal || isLoading) {
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
