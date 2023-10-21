"use client"

import type { SidebarRoutes } from "@builderai/config/types"
import { createIcon } from "@builderai/config/types"

import HeaderSubTab from "~/components/header-subtab"
import { useGetPaths } from "~/lib/use-get-path"
import SubTab from "./subtab"

export default function SidebarMenuSubTabs({
  submodule,
  sideBarRoutes,
}: {
  submodule: string
  sideBarRoutes: SidebarRoutes
}) {
  const { baseUrl, restSegmentsPerRoute } = useGetPaths()

  // give a path prefix calculate sub tab
  const restSegments = restSegmentsPerRoute(submodule)
  const activeSidebarSlug = restSegments[0]!
  const activeSidebarTabSlug = restSegments[1]!

  const activeSubTab = sideBarRoutes?.[activeSidebarSlug]
  const activeSubTabs = activeSubTab?.subTabs
  const activeSidebarTab =
    activeSubTabs?.[activeSidebarTabSlug] ?? activeSubTabs?.[activeSidebarSlug]
  const baseUrlSubTab = `${baseUrl}/${submodule}/${activeSidebarSlug}`

  if (!activeSubTabs) return null

  return (
    <div className="flex flex-col py-4">
      <div className="mb-8 inline-flex h-10 items-center rounded-md bg-background-bg p-1 text-muted-foreground">
        {Object.entries(activeSubTabs).map(([index, item]) => {
          const Icon = item?.icon && createIcon(item?.icon)
          const href =
            activeSidebarSlug === index
              ? `${baseUrlSubTab}`
              : `${baseUrlSubTab}/${index}`

          return (
            <SubTab
              key={index}
              href={href}
              className="rounded-sm"
              classNameActive="bg-background text-background-text shadow-md border"
              icon={Icon && <Icon className="mr-2 h-4 w-4" />}
              title={item.title}
            />
          )
        })}
      </div>
      {activeSidebarTab?.title && (
        <HeaderSubTab
          title={activeSidebarTab.title}
          description={activeSidebarTab?.description}
          action={activeSidebarTab?.action}
        />
      )}
    </div>
  )
}
