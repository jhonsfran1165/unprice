"use client"

import type { DashboardRoute } from "@builderai/config"

import { useGetPaths } from "~/lib/use-get-path"
import HeaderSubTab from "./header-subtab"
import SubTabs from "./subtabs"

export default function MenuSubTabs({
  submodule,
  activeTab,
}: {
  submodule: string
  activeTab: DashboardRoute
}) {
  const { baseUrl, restSegmentsPerRoute } = useGetPaths()

  const restSegments = restSegmentsPerRoute(submodule)
  const activeSlug = restSegments[0]!

  const activeSubTabs = activeTab.subTabs
  const activeSubTab = activeSubTabs?.[activeSlug]
  const baseUrlSubTab = `${baseUrl}/${submodule}`

  if (!activeSubTabs) return null

  return (
    <>
      {activeSubTab?.title && (
        <HeaderSubTab
          title={activeSubTab.title}
          description={activeSubTab?.description}
          action={activeSubTab?.action}
        />
      )}
      <SubTabs
        activeRouteSlug={submodule}
        activeSubTabs={activeSubTabs}
        baseUrl={baseUrlSubTab}
      />
    </>
  )
}
