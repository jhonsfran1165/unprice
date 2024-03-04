"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@builderai/ui/button"
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { api } from "~/trpc/client"

export const VerifyDomainButton = ({ domain }: { domain: string }) => {
  const router = useRouter()
  const { data, isLoading, refetch, isRefetching } =
    api.domains.verify.useQuery(
      { domain },
      {
        refetchInterval: (query) =>
          query.state.data?.status === "Valid Configuration" ? false : 5000,
      }
    )

  useEffect(() => {
    if (data?.status === "Valid Configuration") {
      // update server-side cache
      router.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
