"use client"

import Link from "next/link"

import type { DashboardRoute } from "@builderai/config/types"
import { createIcon } from "@builderai/config/types"
import { cn } from "@builderai/ui/utils"

import { useGetPaths } from "~/lib/use-get-path"

export const Tab = ({
  route,
  activeRoute,
}: {
  route: DashboardRoute
  activeRoute: DashboardRoute | null
}) => {
  const { baseUrl } = useGetPaths()
  const tabPath = `${baseUrl}` + route.href
  const active = activeRoute ? activeRoute.href === route.href : false
  const Icon = route?.icon && createIcon(route?.icon)

  return (
    <Link
      className={cn("border-b-2 py-1", {
        "border-primary-solid": active,
        "border-transparent": !active,
        "cursor-not-allowed opacity-80": route.disabled,
      })}
      href={route.disabled ? "#" : tabPath}
      aria-disabled={route?.disabled}
    >
      <div className="button-ghost rounded-md px-3 py-2 transition-all duration-200">
        <p
          className={cn(
            "flex items-center justify-center whitespace-nowrap text-sm text-background-text hover:text-background-textContrast",
            {
              "opacity-50 hover:text-background-solid": route.disabled,
            }
          )}
        >
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {route.titleTab}
        </p>
      </div>
    </Link>
  )
}

export default Tab
