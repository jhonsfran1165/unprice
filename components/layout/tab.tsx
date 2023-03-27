import type { DashboardNavItem } from "@/lib/types/index"
import { cn } from "@/lib/utils"
import { WrapperLink } from "@/components/shared/wrapper-link"

export const Tab = ({
  tab,
  pathPrefix,
  activeTab,
}: {
  tab: DashboardNavItem
  activeTab: DashboardNavItem | null
  pathPrefix?: string
}) => {
  const tabPath = pathPrefix + tab.href
  const active = activeTab?.href === tab.href || false

  if (!tab) {
    return null
  }

  return (
    <WrapperLink
      href={tab?.disabled ? "#" : tabPath}
      className={cn("border-b-2 p-1", {
        "border-primary-solid": active,
        "border-transparent": !active,
        "cursor-not-allowed opacity-80 text-backgroud": tab.disabled,
      })}
    >
      <div className="rounded-md px-3 py-2 transition-all duration-75 hover:bg-background-bgHover active:bg-background-bgActive">
        <p
          className={cn("text-sm hover:text-background-textContrast", {
            "text-background-textContrast": active,
          })}
        >
          {tab.title}
        </p>
      </div>
    </WrapperLink>
  )
}
