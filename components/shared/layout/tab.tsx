"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { useStore } from "@/lib/stores/layout"
import type { DashboardNavItem } from "@/lib/types/index"
import { cn } from "@/lib/utils"

export const Tab = ({
  path,
  item,
}: {
  path: string
  item: DashboardNavItem
}) => {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    let active = false
    // TODO: refactor later to support multiple modules not only site
    // this is fucking ugly thing but I need to move fast
    // If you don't like it you can go suck a dick
    if (pathname?.startsWith("/site") && segments.length > 2) {
      active = item.href?.split("/").includes(segments[2])
    } else if (!pathname?.startsWith("/site") && segments.length == 2) {
      active = item.href?.split("/").includes(segments[0])
    } else {
      active = item.href === pathname || item.href === `${pathname}/`
    }

    setIsActive(active)

    if (active) {
      useStore.setState((state) => ({
        contextHeader: item.title,
      }))
    }
  }, [pathname])

  return (
    <Link
      key={item.href}
      href={item?.disabled ? path : item.href}
      className={cn("border-b-2 p-1", {
        "border-primary-solid": isActive,
        "border-transparent": !isActive,
        "cursor-not-allowed opacity-80 text-backgroud": item.disabled,
      })}
    >
      <div className="rounded-md px-3 py-2 transition-all duration-75 hover:bg-background-bgHover active:bg-background-bgActive">
        <p
          className={cn("text-sm hover:text-background-textContrast", {
            "text-background-textContrast": isActive,
          })}
        >
          {item.title}
        </p>
      </div>
    </Link>
  )
}
