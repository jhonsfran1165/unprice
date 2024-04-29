import { Suspense } from "react"

import { cn } from "@builderai/ui"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"

import type { DashboardRoute } from "~/types"
import Tab from "./tab"
import UserNav from "./user-nav"
import UserNavSkeleton from "./user-nav-skeleton"

export default function TabsNav(props: {
  className?: string
  basePath: string
  tabs: DashboardRoute[]
  activeTab: DashboardRoute
}) {
  return (
    <div
      className={cn(
        "border-t-1 sticky inset-x-0 left-0 top-0 z-30 block w-12 items-center justify-start border-r border-t-primary-solid bg-background-bgSubtle px-2 transition-all",
        props.className
      )}
    >
      <div className="flex h-full flex-col items-center justify-between">
        <ScrollArea className="flex">
          <div className="flex flex-col items-center gap-4 pt-4">
            {props.tabs.map((route, index) => (
              <Tab
                key={route.href + index}
                href={props.basePath + route.href}
                route={route}
                active={route.href === props.activeTab.href}
              />
            ))}
          </div>

          <ScrollBar orientation="vertical" className="invisible" />
        </ScrollArea>
        <div className="mb-4 flex">
          <Suspense fallback={<UserNavSkeleton />}>
            <UserNav />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
