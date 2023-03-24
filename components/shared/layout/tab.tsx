"use client"

import { useEffect, useState } from "react"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { getActiveSegments } from "@/lib/config/dashboard"
import { useStore } from "@/lib/stores/layout"
import type { DashboardNavItem } from "@/lib/types/index"
import { cn } from "@/lib/utils"
import { WrapperLink } from "@/components/shared/wrapper-link"

export const Tab = ({
  tab,
  pathPrefix,
  numberSegments,
  lastActiveSegment,
}: {
  tab: DashboardNavItem
  pathPrefix?: string
  numberSegments: number
  lastActiveSegment?: string
}) => {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()
  const tabPath = pathPrefix + tab.href
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // TODO: refactor later to support multiple modules and dephts
    // this is a fucking ugly thing but I need to move fast
    // If you don't like it you can go suck a dick
    const lastSegment = segments[segments.length - 1]

    const active =
      tabPath === pathname ||
      tabPath === `${pathname}/` ||
      (segments.length > numberSegments * 2 + 1 &&
        `${tabPath}/${lastSegment}` === `${pathname}`) ||
      false

    setIsActive(active)

    if (active) {
      useStore.setState((state) => ({
        contextHeader: tab.title,
      }))
    }
  }, [pathname])

  return (
    <WrapperLink
      href={tab?.disabled ? "#" : tabPath}
      onClick={() => {
        useStore.setState((state) => ({
          contextHeader: tab.title,
        }))
      }}
      className={cn("border-b-2 p-1", {
        "border-primary-solid": isActive,
        "border-transparent": !isActive,
        "cursor-not-allowed opacity-80 text-backgroud": tab.disabled,
      })}
    >
      <div className="rounded-md px-3 py-2 transition-all duration-75 hover:bg-background-bgHover active:bg-background-bgActive">
        <p
          className={cn("text-sm hover:text-background-textContrast", {
            "text-background-textContrast": isActive,
          })}
        >
          {tab.title}
        </p>
      </div>
    </WrapperLink>
  )
}
