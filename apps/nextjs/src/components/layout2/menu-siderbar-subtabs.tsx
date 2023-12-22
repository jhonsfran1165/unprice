"use client"

import { cache } from "react"
import dynamic from "next/dynamic"

import type { ModuleApp, SubModuleApp } from "@builderai/config"
import { getModulesApp } from "@builderai/config"
import { createIcon } from "@builderai/config/types"

import { TabSkeleton } from "~/components/tab-skeleton"
import { useGetPaths } from "~/lib/use-get-path"

const cachedGetModulesApp = cache(getModulesApp)

const SubTab = dynamic(() => import("~/components/subtab"), {
  loading: () => <TabSkeleton />,
  ssr: false,
})

export default function SidebarMenuSubTabsv<T extends ModuleApp>(props: {
  className?: string
  submodule: SubModuleApp<T>
  module: T
  basePath: string
}) {
  const modules = cachedGetModulesApp({
    module: props.module,
    submodule: props.submodule,
  })

  const { activeTab } = modules
  const { lastSegment, secondToLastSegment } = useGetPaths()

  // get sidebar from the two last segments
  const activeSidebarTab =
    (activeTab &&
      (activeTab.sidebarMenu?.[lastSegment]?.subTabs ??
        activeTab.sidebarMenu?.[secondToLastSegment ?? ""]?.subTabs)) ??
    []

  const baseUrlSubTab = props.basePath + activeTab?.href

  if (activeSidebarTab.length === 0) return null

  console.log({ activeTab })

  return (
    <div className="flex flex-col">
      <div className="mb-8 inline-flex h-10 items-center rounded-md bg-background-bg p-1 text-muted-foreground">
        {Object.entries(activeSidebarTab ?? {}).map(([index, item]) => {
          const Icon = item?.icon && createIcon(item?.icon)

          const href =
            `/${props.submodule as string}/${index}` === activeTab?.href
              ? baseUrlSubTab
              : `${baseUrlSubTab}/${index}`

          return (
            <SubTab
              key={index}
              href={href}
              className="rounded-sm"
              classNameActive="bg-background text-background-text shadow-md border"
              icon={Icon && <Icon className="mr-2 h-4 w-4" />}
              title={item.title}
            />
          )
        })}
      </div>
    </div>
  )
}
