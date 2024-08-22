"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { updateSession } from "~/actions/update-session"

export function RevalidateSession({
  newWorkspaceSlug,
}: {
  newWorkspaceSlug: string
}) {
  const router = useRouter()

  useEffect(() => {
    if (document) {
      updateSession()
      router.push(`/${newWorkspaceSlug}`)
    }
  }, [])

  return null
}
