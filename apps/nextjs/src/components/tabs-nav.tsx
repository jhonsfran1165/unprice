"use client"

import { enableReactComponents } from "@legendapp/state/config/enableReactComponents"
import { enableReactUse } from "@legendapp/state/config/enableReactUse"
import { Show } from "@legendapp/state/react"
import { AnimatePresence } from "framer-motion"

import { cn } from "@builderai/ui"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"

import { Tab } from "~/components/tab"
import { useCanRender } from "~/lib/use-can-render"
import { layoutState } from "~/stores/layout"

enableReactComponents()
enableReactUse()

export default function TabsNav(props: { className?: string }) {
  const canRender = useCanRender()
  const tabs = layoutState.activeModuleTabs.use()
  const activeModuleTab = layoutState.activeModuleTab.use()
  const activePathPrefix = layoutState.activePathPrefix.use()

  return (
    <Show if={canRender} else={null} wrap={AnimatePresence}>
      {() => (
        <div
          className={
            (cn("flex h-12 items-center justify-start bg-background-bgSubtle"),
            props.className)
          }
        >
          <ScrollArea className="h-13 -mb-0.5 max-w-[600px] lg:max-w-none">
            <nav className="flex items-center gap-2">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.module + tab.id + index}
                  tab={tab}
                  pathPrefix={activePathPrefix}
                  activeTab={activeModuleTab}
                />
              ))}
            </nav>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      )}
    </Show>
  )
}
