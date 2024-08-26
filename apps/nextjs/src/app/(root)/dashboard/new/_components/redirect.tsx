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

      // redirect to the url
      router.push(url)
    }

    validate()
  }, [url])

  return <LayoutLoader />
}
