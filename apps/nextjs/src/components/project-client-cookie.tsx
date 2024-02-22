"use client"

import { useEffect } from "react"

import { COOKIE_NAME_PROJECT } from "~/constants"

export function ProjectClientCookie({ projectSlug }: { projectSlug: string }) {
  useEffect(() => {
    if (document) {
      document.cookie = `${COOKIE_NAME_PROJECT}=${projectSlug}; path=/`
    }
  }, [projectSlug])
  return null
}
