import Link from "next/link"

import { cn } from "@builderai/ui"
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@builderai/ui/tooltip"

import { Ping } from "~/components/ping"
import type { DashboardRoute } from "~/types"
import { createIcon } from "~/types"

export const Tab = ({
  route,
  href,
  active,
}: {
  route: DashboardRoute
  href: string
  active: boolean
}) => {
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
                "text-background-text flex items-center justify-center whitespace-nowrap text-sm",
                {
                  "hover:text-background-solid opacity-50": route.disabled,
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
        className="bg-background-bgSubtle"
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
