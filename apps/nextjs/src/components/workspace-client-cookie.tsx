"use client"

import { useEffect } from "react"

import { COOKIE_NAME_WORKSPACE } from "~/constants"

/**
 * ISSUE: using the `middleware` to add a server httpOnly cookie doesn't work
 * req.nextUrl.pathname.startsWith("/app") is not true on the server as we are using the /api/trpc endpoint
 * to mutate our database. For some reasons, querying the database works fine.
 */

export function WorkspaceClientCookie({
  workspaceSlug,
}: {
  workspaceSlug: string
}) {
  useEffect(() => {
    if (document) {
      document.cookie = `${COOKIE_NAME_WORKSPACE}=${workspaceSlug}; path=/`
    }
  }, [workspaceSlug])
  return null
}
