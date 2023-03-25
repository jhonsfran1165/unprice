"use client"

import { useStore } from "@/lib/stores/layout"
import { Tab } from "@/components/shared/layout/tab"

export const TabsNav = () => {
  const { activeTabs: tabs, activePathPrefix, activeTab } = useStore()

  return (
    <div className="-mb-0.5 flex h-12 items-center justify-start space-x-2">
      <nav className="flex flex-wrap items-center gap-2">
        {tabs.length > 0 &&
          tabs.map((tab, index) => (
            <Tab
              key={index}
              tab={tab}
              pathPrefix={activePathPrefix}
              activeTab={activeTab}
            />
          ))}
      </nav>
    </div>
  )
}
