"use client"

import { cache } from "react"
import Link from "next/link"

import type { ModuleApp, SubModuleApp } from "@builderai/config"
import { getModulesApp } from "@builderai/config"
// TODO: this is adding too much bundle size
import * as Icons from "@builderai/ui/icons"
import { cn } from "@builderai/ui/utils"

import { useGetPaths } from "~/lib/use-get-path"

const cachedGetModulesApp = cache(getModulesApp)

export default function SidebarNav<T extends ModuleApp>(props: {
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
  const { pathname } = useGetPaths() // get href prefix of the dynamic slugs
  const activeSideBarRoutes = Object.values(activeTab?.sidebarMenu ?? {})

  if (activeSideBarRoutes.length === 0) return null

  // TODO: support mobile version
  return (
    <nav className="sticky top-20 flex flex-col gap-2 rounded-md px-2 md:min-h-[500px]">
      {activeSideBarRoutes.map((item, index) => {
        const fullPath = props.basePath + item.href
        const active = pathname === fullPath
        const Icon = Icons[item.icon] as React.ElementType

        return (
          item.href && (
            <Link
              key={index}
              prefetch={false}
              href={item.disabled ? "#" : fullPath}
              aria-disabled={item.disabled}
            >
              <span
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-background-bg hover:text-background-textContrast active:bg-background-bgActive",
                  {
                    transparent: !active,
                    "bg-background-bgSubtle": active,
                    "cursor-not-allowed opacity-80": item.disabled,
                  }
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span
                  className={cn({
                    "text-background-textContrast": active,
                  })}
                >
                  {item.title}
                </span>
              </span>
            </Link>
          )
        )
      })}
    </nav>
  )
}
