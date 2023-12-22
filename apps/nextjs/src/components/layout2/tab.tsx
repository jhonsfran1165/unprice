"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { DashboardRoute } from "@builderai/config/types"
import { createIcon } from "@builderai/config/types"
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@builderai/ui/tooltip"
import { cn } from "@builderai/ui/utils"

import { Ping } from "~/components/ping"

export const Tab = ({
  route,
  href,
}: {
  route: DashboardRoute
  href: string
}) => {
  const pathname = usePathname()
  const active = pathname === href
  const Icon = route.icon && createIcon(route?.icon)

  return (
    <Tooltip>
      <TooltipTrigger>
        <Link
          scroll={false}
          className={cn("", {
            "cursor-not-allowed opacity-80": route.disabled,
          })}
          href={route.disabled ? "#" : href}
          aria-disabled={route?.disabled}
          prefetch={false}
        >
          {route?.isNew && (
            <div className="relative">
              <div className="absolute right-1 top-1">
                <Ping />
              </div>
            </div>
          )}
          <div
            className={cn("rounded-md px-2 py-2 transition-all duration-200", {
              "bg-primary-bg": active,
              "button-ghost": !active,
            })}
          >
            <p
              className={cn(
                "flex items-center justify-center whitespace-nowrap text-sm text-background-text",
                {
                  "opacity-50 hover:text-background-solid": route.disabled,
                  "hover:text-background-textContrast": !active,
                  "text-primary-text dark:text-primary-solid": active,
                }
              )}
            >
              <Icon className="h-4 w-4" />
            </p>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent
        className="bg-background-bg"
        sideOffset={10}
        align="center"
        side="right"
      >
        {route.titleTab}
        <TooltipArrow className="fill-background-bg" />
      </TooltipContent>
    </Tooltip>
  )
}

export default Tab
