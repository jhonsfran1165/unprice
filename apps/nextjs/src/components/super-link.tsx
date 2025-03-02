// See https://typeofweb.hashnode.dev/nextjs-prefetch-onmouseenter for a detailed explanation and more code
// See it in action: https://demo.yournextstore.com
"use client"

import { cn, focusRing } from "@unprice/ui/utils"
import { Link } from "next-view-transitions"
import { useRouter } from "next/navigation"
import type { ComponentPropsWithRef, ForwardedRef } from "react"
import { forwardRef } from "react"

export const SuperLink = forwardRef(
  (props: ComponentPropsWithRef<typeof Link>, ref: ForwardedRef<HTMLAnchorElement>) => {
    const router = useRouter()
    const strHref = typeof props.href === "string" ? props.href : props.href.href

    const conditionalPrefetch = () => {
      if (strHref) {
        void router.prefetch(strHref)
      }
    }

    return (
      <Link
        className={cn("cursor-pointer", focusRing, props.className)}
        {...props}
        prefetch={false}
        scroll={false}
        ref={ref}
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
)

SuperLink.displayName = "SuperLink"
