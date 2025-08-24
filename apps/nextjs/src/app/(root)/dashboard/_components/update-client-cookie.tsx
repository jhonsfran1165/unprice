"use client"

import { useQueryClient } from "@tanstack/react-query"
import { COOKIES_APP } from "@unprice/config"
import Cookies from "js-cookie"
import { useCallback, useEffect, useRef } from "react"

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
  const queryClient = useQueryClient()
  const firstRender = useRef(true)

  // just to make we sync the cookie with the current project and workspace
  const cookieOptions = {
    path: "/",
    sameSite: "lax",
    expires: 7,
    secure: process.env.NODE_ENV === "production",
  } as Cookies.CookieAttributes

  const invalidateQueriesProject = useCallback(() => {
    // skip the first render
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    // invalidate queries when project changes
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey0 = query.queryKey[0] as string[]

        // the same user doesn't need to invalidate the workspaces query
        if (queryKey0.includes("workspaces") || queryKey0.includes("domains")) return false

        return true
      },
    })
  }, [projectSlug, workspaceSlug])

  const updateCookie = useCallback(() => {
    Cookies.set(COOKIES_APP.PROJECT, projectSlug ?? "", {
      ...cookieOptions,
    })
    Cookies.set(COOKIES_APP.WORKSPACE, workspaceSlug ?? "", {
      ...cookieOptions,
    })
  }, [projectSlug, workspaceSlug])

  useEffect(() => {
    updateCookie()
    invalidateQueriesProject()

    window.addEventListener("focus", updateCookie)

    return () => {
      window.removeEventListener("focus", updateCookie)
    }
  }, [projectSlug, workspaceSlug])

  return null
}
