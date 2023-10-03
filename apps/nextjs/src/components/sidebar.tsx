"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { DashboardSidebarRoute } from "@builderai/config"
import { cn } from "@builderai/ui"
import * as Icons from "@builderai/ui/icons"

import { useGetPaths } from "~/lib/use-get-path"

export default function SidebarNav(props: {
  dashboardSidebarRoutes: DashboardSidebarRoute[]
  activeSubModuleRoute: DashboardSidebarRoute | null
}) {
  const path = usePathname()
  const activePathPrefix = useGetPaths()
  const sidebarRoutes = props.dashboardSidebarRoutes

  return (
    <aside className="flex-col sm:flex sm:w-[250px]">
      <nav className="grid items-start gap-2">
        {sidebarRoutes.map((route, index) => {
          const fullPath = activePathPrefix + route.href
          const active = fullPath === path
          const Icon = Icons[route.icon] as React.ElementType

          return (
            route.href && (
              <Link
                key={index}
                href={route.disabled ? "#" : fullPath}
                aria-disabled={route.disabled}
              >
                <span
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:border-background-borderHover hover:bg-background-bg hover:text-background-textContrast active:bg-background-bgActive",
                    {
                      transparent: !active,
                      "bg-background-bgSubtle": active,
                      "cursor-not-allowed opacity-80": route.disabled,
                    }
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span
                    className={cn({
                      "text-background-textContrast": active,
                    })}
                  >
                    {route.title}
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
