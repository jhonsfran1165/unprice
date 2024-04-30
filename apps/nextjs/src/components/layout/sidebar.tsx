"use client"

import Link from "next/link"
import { useSelectedLayoutSegments } from "next/navigation"

import { cn } from "@builderai/ui"
import * as Icons from "@builderai/ui/icons"

import type { DashboardRoute } from "~/types"

export default function SidebarNav(props: {
  className?: string
  basePath: string
  activeTab: DashboardRoute
}) {
  const segments = useSelectedLayoutSegments()
  const activeSideBarRoutes = Object.values(props.activeTab?.sidebar ?? {})

  if (activeSideBarRoutes.length === 0) return null

  return (
    <nav className="sticky top-20 flex flex-col gap-2 rounded-md px-2 md:min-h-[500px]">
      {activeSideBarRoutes.map((item, index) => {
        const fullPath = props.basePath + item.href
        const active = item.href.includes(`/${segments[0]}`)
        const Icon = Icons[item.icon] as React.ElementType

        return (
          item.href && (
            <Link
              key={index}
              prefetch={false}
              href={item.disabled ? "#" : fullPath}
              aria-disabled={item.disabled}
            >
              <span
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:text-background-textContrast",
                  {
                    transparent: !active,
                    "cursor-not-allowed opacity-80": item.disabled,
                  }
                )}
              >
                <Icon
                  className={cn("mr-2 h-4 w-4", {
                    "text-background-textContrast": active,
                  })}
                />
                <span
                  className={cn({
                    "text-background-textContrast": active,
                  })}
                >
                  {item.title}
                </span>
              </span>
            </Link>
          )
        )
      })}
    </nav>
  )
}
