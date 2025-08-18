"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@unprice/ui/button"
import { LoadingAnimation } from "@unprice/ui/loading-animation"

import { useTRPC } from "~/trpc/client"

export const VerifyDomainButton = ({ domain }: { domain: string }) => {
  const router = useRouter()
  const trpc = useTRPC()
  const { data, isLoading, refetch, isRefetching } = useQuery(
    trpc.domains.verify.queryOptions(
      { domain },
      {
        refetchInterval: (query) =>
          query.state.data?.status === "Valid Configuration" ? false : 5000,
      }
    )
  )

  useEffect(() => {
    if (data?.status === "Valid Configuration") {
      // update server-side cache
      router.refresh()
    }
  }, [data?.status])

  if (isLoading || isRefetching) {
    return (
      <Button variant="ghost">
        <LoadingAnimation />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      onClick={async (e) => {
        e.preventDefault()
        await refetch()
        router.refresh()
      }}
    >
      Refresh
    </Button>
  )
}
