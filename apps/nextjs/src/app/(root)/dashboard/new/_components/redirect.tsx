"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { updateSession } from "~/actions/update-session"
import LayoutLoader from "~/components/layout/layout-loader"
import { api } from "~/trpc/client"

export default function Redirect({ url }: { url: string }) {
  const router = useRouter()
  const apiUtils = api.useUtils()

  useEffect(() => {
    const validate = async () => {
      // // invalidate the workspaces list to refresh the workspaces
      await apiUtils.workspaces.listWorkspacesByActiveUser.invalidate()

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
