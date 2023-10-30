"use client"

import Link from "next/link"

import type { SidebarRoutes } from "@builderai/config/types"
// TODO: this is adding too much bundle size
// import * as Icons from "@builderai/ui/icons"
import { Settings } from "@builderai/ui/icons"
import { cn } from "@builderai/ui/utils"

import { useGetPaths } from "~/lib/use-get-path"

export default function SidebarNav({
  submodule,
  sidebarMenu,
}: {
  submodule: string
  sidebarMenu: SidebarRoutes
}) {
  const { baseUrl, restSegmentsPerRoute } = useGetPaths() // get href prefix of the dynamic slugs

  // give a path prefix calculate sidebar tabs
  const restSegments = restSegmentsPerRoute(submodule)
  const activeSideBarRouteSlug = restSegments[0]!
  const activeSideBarRoutes = Object.values(sidebarMenu)

  if (activeSideBarRoutes.length === 0) return null

  // TODO: support mobile version
  return (
    <nav className="sticky top-20 flex flex-col gap-2 rounded-md px-4 py-4 md:min-h-[500px]">
      {activeSideBarRoutes.map((item, index) => {
        const fullPath = baseUrl + item.href
        const active = item.href === `/${submodule}/${activeSideBarRouteSlug}`
        // const Icon = Icons[item.icon] as React.ElementType
        const Icon = Settings

        return (
          item.href && (
            <Link
              key={index}
              href={item.disabled ? "#" : fullPath}
              aria-disabled={item.disabled}
            >
              <span
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-background-bg hover:text-background-textContrast active:bg-background-bgActive",
                  {
                    transparent: !active,
                    "bg-background-bgSubtle": active,
                    "cursor-not-allowed opacity-80": item.disabled,
                  }
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
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
