"use client"

import { COOKIES_APP } from "@unprice/config"
import { newId } from "@unprice/db/utils"
import Cookies from "js-cookie"
import { useEffect } from "react"

// A simple function to generate a ID if you don't have one from an ad campaign
export const getOrCreateConversionId = (sessionId?: string): string => {
  if (sessionId) return sessionId
  let id = Cookies.get(COOKIES_APP.SESSION)
  if (!id) {
    id = newId("session")
  }
  return id
}

export function UpdateMarketingCookie({ sessionId }: { sessionId?: string }) {
  const conversionId = getOrCreateConversionId(sessionId)
  // just to make we sync the cookie with the current project and workspace
  const cookieOptions = {
    path: "/",
    sameSite: "lax",
    expires: 1,
    secure: process.env.NODE_ENV === "production",
  } as Cookies.CookieAttributes

  const onFocus = () => {
    Cookies.set(COOKIES_APP.SESSION, conversionId, {
      ...cookieOptions,
    })
  }

  useEffect(() => {
    Cookies.set(COOKIES_APP.SESSION, conversionId, {
      ...cookieOptions,
    })

    window.addEventListener("focus", onFocus)

    return () => {
      window.removeEventListener("focus", onFocus)
    }
  }, [sessionId])

  return null
}
