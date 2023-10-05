import Link from "next/link"

import type { DashboardRoute } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Skeleton } from "@builderai/ui/skeleton"

export const Tab = ({
  route,
  baseUrl,
  activeRoute,
}: {
  route: DashboardRoute
  activeRoute: DashboardRoute | null
  baseUrl: string
}) => {
  const tabPath = `${baseUrl}` + route.href
  const active = activeRoute ? activeRoute.href === route.href : false

  return (
    <Link
      className={cn("border-b-2 p-1", {
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
            "whitespace-nowrap text-sm text-background-text hover:text-background-textContrast",
            {
              "text-background-textContrast": active,
              "text-accent hover:text-background-solid": route.disabled,
            }
          )}
        >
          {route.titleTab}
        </p>
      </div>
    </Link>
  )
}

Tab.Skeleton = function TabsNavSkeleton() {
  return (
    <div className={"border-b-2 border-transparent p-1"}>
      <div className="button-ghost rounded-md px-3 py-2 transition-all duration-200">
        <p
          className={cn(
            "whitespace-nowrap text-sm text-background-text hover:text-background-textContrast"
          )}
        >
          <Skeleton className="h-[18px] w-[70px]" />
        </p>
      </div>
    </div>
  )
}
