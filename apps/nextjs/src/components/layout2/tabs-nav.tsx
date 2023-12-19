import { Suspense } from "react"

import type { DashboardRoute } from "@builderai/config/types"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"
import { cn } from "@builderai/ui/utils"

import UserNav from "../user-nav"
import UserNavSkeleton from "../user-nav-skeleton"
import Tab from "./tab"

export default function TabsNav(props: {
  className?: string
  moduleTabs: DashboardRoute[]
  activeRoute: DashboardRoute | null
}) {
  return (
    <div
      className={cn(
        "-py-2 sticky inset-x-0 left-0 top-0 z-30 block w-auto items-center justify-start overflow-y-auto bg-background-bg px-2 transition-all",
        props.className
      )}
    >
      <div className="flex h-full flex-col items-center justify-between">
        <ScrollArea className="flex">
          <div className="flex flex-col items-center gap-2 border-t-2 border-primary-solid pt-4">
            {props.moduleTabs.map((route, index) => (
              <Tab
                key={route.href + index}
                route={route}
                activeRoute={props.activeRoute}
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
