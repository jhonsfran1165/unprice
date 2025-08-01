"use client"

import { COOKIES_APP } from "@unprice/config"
import Cookies from "js-cookie"
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
  const cookieOptions = {
    path: "/",
    sameSite: "lax",
    expires: 7,
    secure: process.env.NODE_ENV === "production",
  } as Cookies.CookieAttributes

  const onFocus = () => {
    Cookies.set(COOKIES_APP.PROJECT, projectSlug ?? "", {
      ...cookieOptions,
    })
    Cookies.set(COOKIES_APP.WORKSPACE, workspaceSlug ?? "", {
      ...cookieOptions,
    })
  }

  useEffect(() => {
    Cookies.set(COOKIES_APP.PROJECT, projectSlug ?? "", {
      ...cookieOptions,
    })
    Cookies.set(COOKIES_APP.WORKSPACE, workspaceSlug ?? "", {
      ...cookieOptions,
    })

    window.addEventListener("focus", onFocus)

    return () => {
      window.removeEventListener("focus", onFocus)
    }
  }, [projectSlug, workspaceSlug])

  return null
}
