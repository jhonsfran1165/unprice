"use client"

import { COOKIE_NAME_PROJECT, COOKIE_NAME_WORKSPACE } from "@builderai/config"
import { useParams } from "next/navigation"
import { useEffect } from "react"

/**
 * Update the client cookie on focus tab event
 * for project and workspace
 * normally used in the layout component for client side api calls
 * for server side api calls or rsc, the middleware will handle the cookie update
 */
export function UpdateClientCookie() {
  const params = useParams()
  const projectSlugParam = params.projectSlug as string
  const workspaceSlugParam = params.workspaceSlug as string

  // update on focus tab event
  const onFocus = () => {
    if (document) {
      document.cookie = projectSlugParam
        ? `${COOKIE_NAME_PROJECT}=${projectSlugParam}; path=/api/`
        : `${COOKIE_NAME_PROJECT}=; path=/api/; "max-age=0"`
      document.cookie = workspaceSlugParam
        ? `${COOKIE_NAME_WORKSPACE}=${workspaceSlugParam}; path=/api/`
        : `${COOKIE_NAME_WORKSPACE}=; path=/api/; "max-age=0"`
    }
  }

  useEffect(() => {
    window.addEventListener("focus", onFocus)

    onFocus()

    return () => {
      window.removeEventListener("focus", onFocus)
    }
  }, [projectSlugParam, workspaceSlugParam])

  return null
}
