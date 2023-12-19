"use client"

import dynamic from "next/dynamic"

import type { SidebarRoutes } from "@builderai/config/types"
import { createIcon } from "@builderai/config/types"

import HeaderSubTab from "~/components/header-subtab"
import { TabSkeleton } from "~/components/tab-skeleton"
import { useGetPaths } from "~/lib/use-get-path"

const SubTab = dynamic(() => import("~/components/subtab"), {
  loading: () => <TabSkeleton />,
  ssr: false,
})

export default function SidebarMenuSubTabs({
  submodule,
  sideBarRoutes,
}: {
  submodule: string
  sideBarRoutes: SidebarRoutes
}) {
  const { baseUrl, restSegmentsPerRoute, pathname } = useGetPaths()

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

          const active = href === pathname

          return (
            <SubTab
              key={index}
              href={href}
              active={active}
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
