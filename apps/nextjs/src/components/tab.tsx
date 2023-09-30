import Link from "next/link"

import type { DashboardNavItem } from "@builderai/config"
import { cn } from "@builderai/ui"

export const Tab = ({
  tab,
  pathPrefix,
  activeTab,
}: {
  tab: DashboardNavItem
  activeTab?: DashboardNavItem | null
  pathPrefix?: string
}) => {
  const tabPath = pathPrefix + tab.href
  const active = activeTab?.href === tab.href || false

  return (
    <Link
      className={cn("border-b-2 p-1", {
        "border-primary-solid": active,
        "border-transparent": !active,
        "cursor-not-allowed opacity-80": tab.disabled,
      })}
      href={tab.disabled ? "#" : tabPath}
      aria-disabled={tab.disabled}
    >
      <div className="button-ghost rounded-md px-3 py-2 transition-all duration-200">
        <p
          className={cn(
            "text-sm text-background-text hover:text-background-textContrast",
            {
              "text-background-textContrast": active,
              "text-accent hover:text-background-solid": tab?.disabled,
            }
          )}
        >
          {tab?.titleTab ?? tab.title}
        </p>
      </div>
    </Link>
  )
}
