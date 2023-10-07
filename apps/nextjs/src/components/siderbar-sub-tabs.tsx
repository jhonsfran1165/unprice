"use client"

import type { SidebarRoutes } from "@builderai/config"
import { createIcon } from "@builderai/config"

import { useGetPaths } from "~/lib/use-get-path"
import HeaderSection from "./header-section"
import SubTab from "./subtab"

export default function SidebarSubTabs({
  route,
  sideBarRoutes,
}: {
  route: string
  sideBarRoutes: SidebarRoutes
}) {
  const { baseUrl, restUrl } = useGetPaths()

  // give a path prefix calculate sub tab
  const activeSidebarSlug = restUrl.replace(`${route}/`, "").split("/")[0]!
  const activeSidebarTabSlug = restUrl.replace(`${route}/`, "").split("/")[1]!

  const activeSubTab = sideBarRoutes?.[activeSidebarSlug]
  const activeSubTabs = activeSubTab?.subTabs
  const activeSidebarTab =
    activeSubTabs?.[activeSidebarTabSlug] ?? activeSubTabs?.[activeSidebarSlug]
  const baseUrlSubTab = `${baseUrl}/${route}/${activeSidebarSlug}`

  if (!activeSubTabs) return null

  return (
    <>
      {activeSidebarTab?.title && (
        <HeaderSection
          title={activeSidebarTab.title}
          description={activeSidebarTab?.description}
          action={activeSidebarTab?.action}
        />
      )}
      <div className="mb-4 inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
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
              icon={Icon && <Icon className="mr-2 h-4 w-4" />}
              title={item.title}
            />
          )
        })}
      </div>
    </>
  )
}
