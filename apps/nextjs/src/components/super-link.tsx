// See https://typeofweb.hashnode.dev/nextjs-prefetch-onmouseenter for a detailed explanation and more code
// See it in action: https://demo.yournextstore.com
"use client"

import type { ComponentPropsWithRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export const SuperLink = (props: ComponentPropsWithRef<typeof Link>) => {
  const router = useRouter()
  return (
    <Link
      {...props}
      onMouseEnter={(e) => {
        const href =
          typeof props.href === "string" ? props.href : props.href.href
        if (href) {
          router.prefetch(href)
        }
        return props.onMouseEnter?.(e)
      }}
    />
  )
}
