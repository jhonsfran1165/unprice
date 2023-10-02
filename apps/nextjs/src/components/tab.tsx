import Link from "next/link"

import type { DashboardNavItem } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Skeleton } from "@builderai/ui/skeleton"

export const Tab = ({
  tab,
  pathPrefix,
  activeTab,
}: {
  tab: DashboardNavItem
  activeTab: DashboardNavItem
  pathPrefix: string
}) => {
  const tabPath = `${pathPrefix}` + tab.href
  const active = (activeTab && activeTab.href === tab.href) ?? false

  return (
    <Link
      className={cn("border-b-2 p-1", {
        "border-primary-solid": active,
        "border-transparent": !active,
        "cursor-not-allowed opacity-80": tab.disabled,
      })}
      href={tab.disabled ? "#" : tabPath}
      aria-disabled={tab?.disabled}
    >
      <div className="button-ghost rounded-md px-3 py-2 transition-all duration-200">
        <p
          className={cn(
            "whitespace-nowrap text-sm text-background-text hover:text-background-textContrast",
            {
              "text-background-textContrast": active,
              "text-accent hover:text-background-solid": tab.disabled,
            }
          )}
        >
          {tab.titleTab ?? tab.title}
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
