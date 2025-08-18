"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { updateSession } from "~/actions/update-session"
import LayoutLoader from "~/components/layout/layout-loader"

export default function Redirect({ url }: { url: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    const validate = async () => {
      // refetch active project queries
      await queryClient.refetchQueries({
        queryKey: ["projects"],
        type: "active",
      })

      // refetch active workspace queries
      await queryClient.refetchQueries({
        queryKey: ["workspaces"],
        type: "active",
      })

      // // trigger the session update
      await updateSession()

      // wait 1 second to make sure the session is updated
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // redirect to the url
      router.push(url)
    }

    validate()
  }, [])

  return <LayoutLoader />
}
