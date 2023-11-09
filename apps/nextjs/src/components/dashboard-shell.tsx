import React, { cache } from "react"

import type { ModuleApp, SubModuleApp } from "@builderai/config"
import { getModulesApp } from "@builderai/config"
import { cn } from "@builderai/ui/utils"

import HeaderTab from "~/components/header-tab"
import MaxWidthWrapper from "~/components/max-width-wrapper"
import MenuSubTabs from "~/components/menu-subtabs"
import SidebarNav from "~/components/sidebar"
import TabsNav from "~/components/tabs-nav"
import SidebarMenuSubTabs from "./menu-siderbar-subtabs"

const cachedGetModulesApp = cache(getModulesApp)

// TODO: add dashboard skeleton
export function DashboardShell<T extends ModuleApp>(props: {
  title: string
  module: T
  submodule: SubModuleApp<T>
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  description?: string
  isLoading?: boolean
}) {
  const modules = cachedGetModulesApp({
    module: props.module,
    submodule: props.submodule,
  })

  const newElement = React.cloneElement(
    <React.Fragment>{props?.children ?? ""}</React.Fragment>,
    {
      extraProp: "Some extra prop",
    }
  )

  const { activeTab, moduleTabs } = modules

  // TODO: handle this error
  if (!activeTab) return null

  // TODO: support nested modules with dynamic routes

  return (
    <>
      {moduleTabs.length > 0 && (
        <TabsNav moduleTabs={moduleTabs} activeRoute={activeTab} />
      )}

      {props.title && (
        <HeaderTab
          title={props.title}
          action={props.action}
          description={props.description}
        />
      )}

      <MaxWidthWrapper className="max-w-screen-2xl">
        {/* sidebar menu config */}
        {activeTab?.sidebarMenu && (
          <div className="flex flex-col gap-12 sm:flex-1 sm:flex-row">
            <aside className="flex flex-col sm:flex sm:w-1/4">
              <SidebarNav
                submodule={props.submodule as string}
                sidebarMenu={activeTab.sidebarMenu}
              />
            </aside>
            <div className="flex flex-1 flex-col sm:w-3/4">
              <SidebarMenuSubTabs
                submodule={props.submodule as string}
                sideBarRoutes={activeTab.sidebarMenu}
              />
              <div className={cn("space-y-6", props.className)}>
                {props.children}
              </div>
            </div>
          </div>
        )}

        {/* without sidebar menu config */}
        {!activeTab?.sidebarMenu && (
          <div className="flex flex-1 flex-col">
            <MenuSubTabs
              submodule={props.submodule as string}
              activeTab={activeTab}
            />
            <div className={cn("space-y-6", props.className)}>{newElement}</div>
          </div>
        )}
      </MaxWidthWrapper>
    </>
  )
}
