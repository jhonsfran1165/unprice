"use client"

import { useEffect, useMemo } from "react"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { getActiveTabs } from "@/lib/config/dashboard"
import { useStore } from "@/lib/stores/layout"
import { Tab } from "@/components/shared/layout/tab"

export const TabsNav = () => {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()
  const { modulesApp } = useStore()

  const { tabs, pathPrefix, lastActiveSegment, numberSegments } =
    useMemo(() => {
      return getActiveTabs(segments, modulesApp)
    }, [segments, modulesApp])

  useEffect(() => {
    useStore.setState({
      orgId: parseInt(segments[1]),
      siteId: parseInt(segments[3]),
    })
  }, [pathname])

  return (
    <div className="-mb-0.5 flex h-12 items-center justify-start space-x-2">
      <nav className="flex flex-wrap items-center gap-2">
        {tabs.length > 0 &&
          tabs.map((tab, index) => (
            <Tab
              key={index}
              tab={tab}
              pathPrefix={pathPrefix}
              numberSegments={numberSegments}
              lastActiveSegment={lastActiveSegment}
            />
          ))}
      </nav>
    </div>
  )
}
