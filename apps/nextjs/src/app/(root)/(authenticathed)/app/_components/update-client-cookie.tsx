"use client"

import { COOKIE_NAME_PROJECT, COOKIE_NAME_WORKSPACE } from "@builderai/config"
import { useEffect } from "react"

/**
 * Update the client cookie on focus tab event
 * for project and workspace
 * normally used in the layout component for client side api calls
 * for server side api calls or rsc, the middleware will handle the cookie update
 */
export function UpdateClientCookie({
  projectSlug,
  workspaceSlug,
}: { projectSlug: string | null; workspaceSlug: string | null }) {
  // just to make we sync the cookie with the current project and workspace
  const onFocus = () => {
    if (document) {
      document.cookie = `${COOKIE_NAME_PROJECT}=${projectSlug}; path=/`
      document.cookie = `${COOKIE_NAME_WORKSPACE}=${workspaceSlug}; path=/`
    }
  }

  useEffect(() => {
    if (document) {
      document.cookie = `${COOKIE_NAME_PROJECT}=${projectSlug}; path=/`
      document.cookie = `${COOKIE_NAME_WORKSPACE}=${workspaceSlug}; path=/`
    }

    window.addEventListener("focus", onFocus)

    return () => {
      window.removeEventListener("focus", onFocus)
    }
  }, [projectSlug, workspaceSlug])

  return null
}
