"use client"

import type { SidebarRoutes } from "@builderai/config"

import HeaderSubTab from "~/components/header-subtab"
import SubTabs from "~/components/subtabs"
import { useGetPaths } from "~/lib/use-get-path"

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
    <>
      {activeSidebarTab?.title && (
        <HeaderSubTab
          title={activeSidebarTab.title}
          description={activeSidebarTab?.description}
          action={activeSidebarTab?.action}
        />
      )}
      <SubTabs
        activeRouteSlug={activeSidebarSlug}
        activeSubTabs={activeSubTabs}
        baseUrl={baseUrlSubTab}
      />
    </>
  )
}
