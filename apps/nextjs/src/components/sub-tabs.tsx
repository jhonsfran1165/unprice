"use client"

import Link from "next/link"

import type { DashboardRoute } from "@builderai/config"
import { cn } from "@builderai/ui"
import * as Icons from "@builderai/ui/icons"

import { useGetPaths } from "~/lib/use-get-path"

export default function SubTabs({
  route,
  activeTab,
}: {
  route: string
  activeTab: DashboardRoute | null
}) {
  const { baseUrl, pathname, restUrl } = useGetPaths()

  // give a path prefix calculate sub tab
  const activeSubTabSlug = restUrl.replace(`${route}/`, "").split("/")[0]!

  const sideBarRoutes = activeTab?.sidebarMenu
  const activeSubTab = sideBarRoutes?.[activeSubTabSlug]

  // only admit one type of tabs can't support both for now
  const activeSubTabs = activeSubTab?.subTabs ?? activeTab?.subTabs ?? []

  // only add sidebar prefix if there is a sidebar
  const baseUrlSubTab = sideBarRoutes
    ? `${baseUrl}/${route}/${activeSubTabSlug}`
    : `${baseUrl}/${route}`

  if (activeSubTabs.length === 0) return null

  // render the first tab the same icon that the parent tab has
  const SubTabIcon =
    activeSubTab?.icon && (Icons[activeSubTab.icon] as React.ElementType)
  const TabIcon =
    activeTab?.icon && (Icons[activeTab.icon] as React.ElementType)

  return (
    <div className="mb-4 inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
      <Link
        href={`${baseUrlSubTab}`}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          baseUrlSubTab === pathname &&
            "bg-background text-foreground shadow-sm"
        )}
      >
        {(SubTabIcon && <SubTabIcon className="mr-2 h-4 w-4" />) ??
          (TabIcon && <TabIcon className="mr-2 h-4 w-4" />)}
        {activeSubTab?.title ?? activeTab?.title}
      </Link>
      {Object.entries(activeSubTabs).map(([index, item]) => {
        const Icon = item?.icon && (Icons[item.icon] as React.ElementType)
        return (
          <Link
            key={index}
            href={`${baseUrlSubTab}/${index}`}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              `${baseUrlSubTab}/${index}` === pathname &&
                "bg-background text-foreground shadow-sm"
            )}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {item.title}
          </Link>
        )
      })}
    </div>
  )
}
