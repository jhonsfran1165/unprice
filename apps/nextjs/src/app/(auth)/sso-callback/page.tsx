"use client"

import { useEffect } from "react"

import type { HandleOAuthCallbackParams } from "@builderai/auth"
import { useClerk } from "@builderai/auth"
import * as Icons from "@builderai/ui/icons"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

export default function SSOCallback(props: {
  searchParams: HandleOAuthCallbackParams
}) {
  const { handleRedirectCallback } = useClerk()

  useEffect(() => {
    void handleRedirectCallback(props.searchParams)
  }, [props.searchParams, handleRedirectCallback])

  return (
    <div className="flex items-center justify-center">
      <Icons.Spinner className="mr-2 h-16 w-16 animate-spin" />
    </div>
  )
}
