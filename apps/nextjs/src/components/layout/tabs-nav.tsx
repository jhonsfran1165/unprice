"use client"

import { useOrganization, useUser } from "@builderai/auth"
import { AppModules } from "@builderai/config"
import { cn } from "@builderai/ui"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"
import { Skeleton } from "@builderai/ui/skeleton"

import { Tab } from "~/components/layout/tab"
import { state } from "~/store/layout"

export const TabsNav = (props: { className?: string }) => {
  const { organization } = useOrganization()

  const { user } = useUser()

  const workspaceSlug = organization ? organization?.slug : user?.username

  // const { activeTabs: tabs, activePathPrefix, activeTab } = useStore()
  // const segments = useSelectedLayoutSegments()

  // // no tabs if there is only one segment
  // if (segments.length <= 1) {
  //   return null
  // }

  const tabs = AppModules.workspace
  return (
    <div
      className={
        (cn("flex h-12 items-center justify-start bg-background-bgSubtle"),
        props.className)
      }
    >
      <ScrollArea className="h-13 -mb-1 max-w-[600px] lg:max-w-none">
        <nav
          onClick={() => {
            state.todos.push({
              id: "dsfsdf",
              text: new Date().toISOString(),
            })
          }}
          className="flex items-center gap-2"
        >
          {tabs.length > 0
            ? tabs.map((tab, index) => (
                <Tab
                  key={tab.slug + index + tab.title}
                  tab={tab}
                  pathPrefix={"/" + workspaceSlug ?? ""}
                  // activeTab={activeTab}
                />
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mx-2 h-[21px] w-[54px]" />
              ))}
        </nav>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
