import React, { cache } from "react"

import type { ModuleApp, SubModuleApp } from "@builderai/config"
import { getModulesApp } from "@builderai/config"
import { cn } from "@builderai/ui"

import HeaderTab from "~/components/header-tab"
import MaxWidthWrapper from "~/components/max-width-wrapper"
import SidebarMenuSubTabs from "~/components/menu-siderbar-subtabs"
import MenuSubTabs from "~/components/menu-subtabs"
import SidebarNav from "~/components/sidebar"
import TabsNav from "~/components/tabs-nav"

const cachedGetModulesApp = cache(getModulesApp)

// TODO: add dashboard skeleton
export function DashboardShell<T extends ModuleApp>(props: {
  title: string
  module: T
  submodule: SubModuleApp<T>
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  isLoading?: boolean
}) {
  const modules = cachedGetModulesApp({
    module: props.module,
    submodule: props.submodule,
  })

  const { activeTab, moduleTabs } = modules

  // TODO: handle this error
  if (!activeTab) return null

  return (
    <>
      {moduleTabs.length > 0 && (
        <TabsNav moduleTabs={moduleTabs} activeRoute={activeTab} />
      )}

      {props.title && <HeaderTab title={props.title} action={props.action} />}

      <MaxWidthWrapper className="my-10 max-w-screen-2xl">
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
            <div className={cn("space-y-6", props.className)}>
              {props.children}
            </div>
          </div>
        )}
      </MaxWidthWrapper>
    </>
  )
}

// DashboardShell.Skeleton = function DashboardShellSkeleton(props: {
//   title: string
//   module: ModuleApp
//   submodule?: string
//   routeSlug: string
//   description: React.ReactNode
//   action?: React.ReactNode
//   children: React.ReactNode
//   className?: string
//   isLoading: boolean
// }) {
//   return (
//     <>
//       {props.hasTabs && (<nav className="flex items-center gap-2">
//       {Array.from({ length: 4 }).map((_, i) => (
//         <Tab.Skeleton key={i} />
//       ))}
//     </nav>)}
//     {props.hasHeader && (<div className="z-30 flex h-36 items-center border-b bg-background text-background-textContrast">
//       <MaxWidthWrapper className="max-w-screen-2xl">
//         <Skeleton className="h-[40px] w-[200px]" />
//       </MaxWidthWrapper>
//     </div>)}

//       <MaxWidthWrapper className="my-10 max-w-screen-2xl">
//         <div className="flex flex-col gap-12 sm:flex-1 sm:flex-row">
//           {props.hasSidebar && (
//             <div className="flex-col sm:flex sm:w-[250px]">
//             <div className="grid items-start gap-2">
//               {Array.from({ length: 3 }).map((_, i) => (
//                 <span
//                   key={i}
//                   className={"group flex items-center rounded-md px-3 py-2"}
//                 >
//                   <Skeleton className="mr-2 h-4 w-4 rounded-xl" />

//                   <span className={"text-background-textContrast"}>
//                     <Skeleton className="h-[20px] w-[50px]" />
//                   </span>
//                 </span>
//               ))}
//             </div>
//           </div>
//           )}
//           <div className="flex flex-1 flex-col">
//             <div className="mb-4 flex items-center justify-between">
//               <div className="space-y-1">
//                 <h1 className="font-cal text-xl font-semibold leading-none">
//                   {props.title}
//                 </h1>
//                 {typeof props.description === "string" ? (
//                   <h2 className="text-base text-muted-foreground">
//                     {props.description}
//                   </h2>
//                 ) : (
//                   props.description
//                 )}
//               </div>
//               {props.action}
//             </div>
//             {breadcrumbRoutes && (
//               <Breadcrumbs
//                 breadcrumbRoutes={breadcrumbRoutes}
//                 routeSlug={props.routeSlug}
//               />
//             )}
//             <div className={props.className}>{props.children}</div>
//           </div>
//         </div>
//       </MaxWidthWrapper>
//     </>
//   )
// }
