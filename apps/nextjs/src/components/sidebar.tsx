"use client"

import Link from "next/link"

import type { DashboardRoute, SidebarRoutes } from "@builderai/config"
import { cn } from "@builderai/ui"
import * as Icons from "@builderai/ui/icons"

import { useGetPaths } from "~/lib/use-get-path"

export default function SidebarNav({
  route,
  activeModuleTabRoute,
}: {
  route: string
  activeModuleTabRoute: DashboardRoute | null
}) {
  const { baseUrl, restUrl } = useGetPaths() // get hte prefix of the dynamic slugs

  // give a path prefix calculate sidebar tabs
  const activeSideBarRouteSlug = restUrl.replace(`${route}/`, "").split("/")[0]!

  const sideBarData =
    activeModuleTabRoute?.sidebarRoutes ?? ({} as SidebarRoutes)
  const activeSideBarRoutes = Object.values(sideBarData)

  if (activeSideBarRoutes.length === 0) return null

  return (
    <aside className="flex-col sm:flex sm:w-1/4">
      <nav className="grid items-start gap-2">
        {activeSideBarRoutes.map((item, index) => {
          const fullPath = baseUrl + item.href
          const active = item.href === `/${route}/${activeSideBarRouteSlug}`
          const Icon = Icons[item.icon] as React.ElementType

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
    </aside>
  )
}
