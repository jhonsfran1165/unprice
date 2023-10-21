"use client"

import { createIcon } from "@builderai/config"
import type { DashboardRoute } from "@builderai/config/types"

import { useGetPaths } from "~/lib/use-get-path"
import HeaderSubTab from "./header-subtab"
import SubTab from "./subtab"

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
      <div className="mb-10 inline-flex h-12 items-center border-b text-muted-foreground">
        {Object.entries(activeSubTabs).map(([index, item]) => {
          const Icon = item?.icon && createIcon(item?.icon)
          const href =
            submodule === index
              ? `${baseUrlSubTab}`
              : `${baseUrlSubTab}/${index}`

          return (
            <SubTab
              key={index}
              className="rounded-t-lg border border-transparent px-6 py-3 text-base font-semibold"
              classNameActive="border-background-border border-b-background-base border-b-2 text-background-text"
              href={href}
              icon={Icon && <Icon className="mr-2 h-4 w-4" />}
              title={item.title}
            />
          )
        })}
      </div>
      {activeSubTab?.title && (
        <HeaderSubTab
          title={activeSubTab.title}
          description={activeSubTab?.description}
          action={activeSubTab?.action}
        />
      )}
    </>
  )
}
