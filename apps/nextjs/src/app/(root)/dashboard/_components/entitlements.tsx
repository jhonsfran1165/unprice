"use client"

import { useAtom } from "jotai"
import { useEffect } from "react"
import { entitlementsAtom } from "~/hooks/use-entitlement"
import { api } from "~/trpc/client"

export function Entitlements({
  unPriceCustomerId,
  isInternal,
}: {
  unPriceCustomerId: string
  isInternal: boolean
}) {
  const [data, setData] = useAtom(entitlementsAtom)
  const [entitlements] = api.customers.entitlements.useSuspenseQuery(
    {
      customerId: unPriceCustomerId,
      noCache: true,
    },
    {
      staleTime: 1000 * 60 * 60, // 1 hour
      initialData: data,
    }
  )

  useEffect(() => {
    setData({
      entitlements: entitlements.entitlements,
      isInternal,
    })
  }, [unPriceCustomerId, isInternal])

  return null
}
