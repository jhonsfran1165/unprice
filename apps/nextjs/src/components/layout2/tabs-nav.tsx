import { cache, Suspense } from "react"

import type { ModuleApp, SubModuleApp } from "@builderai/config"
import { getModulesApp } from "@builderai/config"
import { cn } from "@builderai/ui"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"

import UserNav from "../user-nav"
import UserNavSkeleton from "../user-nav-skeleton"
import Tab from "./tab"

const cachedGetModulesApp = cache(getModulesApp)

export default function TabsNav<T extends ModuleApp>(props: {
  className?: string
  submodule: SubModuleApp<T>
  module: T
  basePath: string
}) {
  const modules = cachedGetModulesApp({
    module: props.module,
    submodule: props.submodule,
  })

  const { moduleTabs } = modules

  return (
    <div
      className={cn(
        "-py-2 sticky inset-x-0 left-0 top-0 z-30 block w-12 items-center justify-start bg-background-bg px-2 transition-all",
        props.className
      )}
    >
      <div className="flex h-full flex-col items-center justify-between">
        <ScrollArea className="flex">
          <div className="flex flex-col items-center gap-2 border-t-2 border-primary-solid pt-4">
            {moduleTabs.map((route, index) => (
              <Tab
                key={route.href + index}
                href={props.basePath + route.href}
                route={route}
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
