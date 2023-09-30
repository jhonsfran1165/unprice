"use client"

import { Show } from "@legendapp/state/react"
import { AnimatePresence } from "framer-motion"

import { cn } from "@builderai/ui"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"
import { Skeleton } from "@builderai/ui/skeleton"

import { Tab } from "~/components/layout/tab"
import { layoutState } from "~/stores/layout"

export const TabsNav = (props: { className?: string }) => {
  const activePathPrefix = layoutState.activePathPrefix.use()
  const canRenderTabs = layoutState.canRenderTabs.use()
  const tabs = layoutState.activeModuleTabs.use()
  const activeModuleTab = layoutState.activeModuleTab.use()

  return (
    <Show if={canRenderTabs} else={null} wrap={AnimatePresence}>
      {() => (
        <div
          className={
            (cn("flex h-12 items-center justify-start bg-background-bgSubtle"),
            props.className)
          }
        >
          <ScrollArea className="h-13 -mb-0.5 max-w-[600px] lg:max-w-none">
            <nav className="flex items-center gap-2">
              {tabs.length > 0
                ? tabs.map((tab, index) => (
                    <Tab
                      key={tab.module + tab.id + index}
                      tab={tab}
                      pathPrefix={activePathPrefix}
                      activeTab={activeModuleTab}
                    />
                  ))
                : Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="mx-2 h-[21px] w-[54px]" />
                  ))}
            </nav>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      )}
    </Show>
  )
}
