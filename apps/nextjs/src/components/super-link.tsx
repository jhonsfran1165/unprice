// See https://typeofweb.hashnode.dev/nextjs-prefetch-onmouseenter for a detailed explanation and more code
// See it in action: https://demo.yournextstore.com
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ComponentPropsWithRef } from "react"

export const SuperLink = (props: ComponentPropsWithRef<typeof Link>) => {
  const router = useRouter()
  const strHref = typeof props.href === "string" ? props.href : props.href.href

  const conditionalPrefetch = () => {
    if (strHref) {
      void router.prefetch(strHref)
    }
  }

  return (
    <Link
      {...props}
      prefetch={false}
      scroll={false}
      onMouseEnter={(e) => {
        conditionalPrefetch()
        return props.onMouseEnter?.(e)
      }}
      onPointerEnter={(e) => {
        conditionalPrefetch()
        return props.onPointerEnter?.(e)
      }}
      onTouchStart={(e) => {
        conditionalPrefetch()
        return props.onTouchStart?.(e)
      }}
      onFocus={(e) => {
        conditionalPrefetch()
        return props.onFocus?.(e)
      }}
    />
  )
}
