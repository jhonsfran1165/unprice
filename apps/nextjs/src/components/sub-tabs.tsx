"use client"

import type { DashboardRoute } from "@builderai/config"
import { createIcon, isSubTabsRoutes } from "@builderai/config"

import { useGetPaths } from "~/lib/use-get-path"
import HeaderSection from "./header-section"
import SubTab from "./subtab"

export default function SubTabs({
  route,
  activeTab,
}: {
  route: string
  activeTab: DashboardRoute
}) {
  const { baseUrl, restUrl } = useGetPaths()

  // give a path prefix calculate sub tab
  const activeSlug = restUrl.replace(`${route}/`, "").split("/")[0]!

  if (!isSubTabsRoutes(activeTab?.subTabs)) return null

  const activeSubTabs = activeTab.subTabs
  const activeSubTab = activeSubTabs?.[activeSlug]
  const baseUrlSubTab = `${baseUrl}/${route}`

  if (!activeSubTabs) return null

  return (
    <>
      {activeSubTab?.title && (
        <HeaderSection
          title={activeSubTab.title}
          description={activeSubTab?.description}
          action={activeSubTab?.action}
        />
      )}
      <div className="mb-4 inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
        {Object.entries(activeSubTabs).map(([index, item]) => {
          const Icon = item?.icon && createIcon(item?.icon)
          const href =
            route === index ? `${baseUrlSubTab}` : `${baseUrlSubTab}/${index}`

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
