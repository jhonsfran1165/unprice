import type { DashboardRoute } from "@builderai/config/types"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"
import { cn } from "@builderai/ui/utils"

import Tab from "./tab"

export default function TabsNav(props: {
  className?: string
  moduleTabs: DashboardRoute[]
  activeRoute: DashboardRoute | null
}) {
  return (
    <div
      className={cn(
        "sticky inset-x-0 top-0 z-30 flex h-12 w-full items-center justify-start border-b bg-background-bg px-2 transition-all",
        props.className
      )}
    >
      <ScrollArea className="-mb-1.5 h-12 lg:max-w-none">
        <nav className="flex w-auto items-center gap-2">
          {props.moduleTabs.map((route, index) => (
            <Tab
              key={route.href + index}
              route={route}
              activeRoute={props.activeRoute}
            />
          ))}
        </nav>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
