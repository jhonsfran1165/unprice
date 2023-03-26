"use client"

import { useEffect, useState } from "react"

import { useStore } from "@/lib/stores/layout"
import { DashboardNavItem } from "@/lib/types"
import { Tab } from "@/components/shared/layout/tab"

interface TabProps {
  tabs: DashboardNavItem[]
  pathPrefix: string
  activeTab: DashboardNavItem | null
}

export const TabsNav = () => {
  const { activeTabs: tabs, activePathPrefix, activeTab } = useStore()
  const [tabsConfig, setTabsConfig] = useState<TabProps>({
    tabs: [],
    pathPrefix: "",
    activeTab: null,
  })

  useEffect(() => {
    setTabsConfig({
      tabs,
      pathPrefix: activePathPrefix,
      activeTab,
    })
  }, [activeTab])

  return (
    <div className="-mb-0.5 flex h-12 items-center justify-start space-x-2">
      <nav className="flex flex-wrap items-center gap-2">
        {tabsConfig.tabs.length > 0 &&
          tabs.map((tab, index) => (
            <Tab
              key={index}
              tab={tab}
              pathPrefix={tabsConfig.pathPrefix}
              activeTab={tabsConfig.activeTab}
            />
          ))}
      </nav>
    </div>
  )
}
