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

  // update on focus tab event
  const onFocus = () => {
    if (document) {
      document.cookie = projectSlug
        ? `${COOKIE_NAME_PROJECT}=${projectSlug}; path=/${workspaceSlug}/`
        : `${COOKIE_NAME_PROJECT}=; path=/${workspaceSlug}/; "max-age=0"`
      document.cookie = workspaceSlug
        ? `${COOKIE_NAME_WORKSPACE}=${workspaceSlug}; path=/${workspaceSlug}/`
        : `${COOKIE_NAME_WORKSPACE}=; path=/${workspaceSlug}; "max-age=0"`
    }
  }

  useEffect(() => {
    if (!document) return

    document.cookie = projectSlug
      ? `${COOKIE_NAME_PROJECT}=${projectSlug}; path=/${workspaceSlug}/`
      : `${COOKIE_NAME_PROJECT}=; path=/${workspaceSlug}/; "max-age=0"`
    document.cookie = workspaceSlug
      ? `${COOKIE_NAME_WORKSPACE}=${workspaceSlug}; path=/${workspaceSlug}/`
      : `${COOKIE_NAME_WORKSPACE}=; path=/${workspaceSlug}/; "max-age=0"`

    window.addEventListener("focus", onFocus)

    return () => {
      window.removeEventListener("focus", onFocus)
    }
  }, [projectSlug, workspaceSlug])

  return null
}
