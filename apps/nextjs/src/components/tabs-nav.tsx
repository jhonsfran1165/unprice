import dynamic from "next/dynamic"

import type { DashboardRoute } from "@builderai/config/types"
import { cn } from "@builderai/ui/utils"

const TabsShell = dynamic(() => import("./tabs-shell"), {
  ssr: false,
})

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
      <TabsShell
        moduleTabs={props.moduleTabs}
        activeRoute={props.activeRoute}
      />
    </div>
  )
}
