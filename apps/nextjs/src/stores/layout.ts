import type { ObservableBaseFns } from "@legendapp/state"
import { computed, observable } from "@legendapp/state"

import type { DashboardNavItem, ModulesAppNav } from "@builderai/config"
import { ModulesApp } from "@builderai/config"

export interface Layout {
  contextHeader: string
  workspaceSlug: string
  projectSlug: string
  activeModule: string
  activeSegments: string[]
  modulesApp: ModulesAppNav
  activeModuleTab?: DashboardNavItem
  activeModuleTabs: ObservableBaseFns<readonly DashboardNavItem[]>
  activePathPrefix: string
  canRenderHeaderContext: boolean
}

export const layoutState = observable<Layout>({
  contextHeader: "",
  workspaceSlug: "",
  projectSlug: "",
  activeModule: "",
  activePathPrefix: "",
  activeSegments: [],
  modulesApp: ModulesApp,
  activeModuleTabs: computed((): readonly DashboardNavItem[] => {
    const workspaceSlug = layoutState.workspaceSlug.get()
    const projectSlug = layoutState.projectSlug.get()
    const activeSegment = layoutState.activeSegments.get()[0] ?? "overview"

    let activeModule = ""
    let activePathPrefix = ""
    let activeModuleTabs = [] as DashboardNavItem[]

    if (projectSlug) {
      activeModule = "project"
      activePathPrefix = `/${workspaceSlug}/${projectSlug}`
      activeModuleTabs = layoutState.modulesApp.project.get()
    } else if (workspaceSlug) {
      activeModule = "workspace"
      activePathPrefix = `/${workspaceSlug}`
      activeModuleTabs = layoutState.modulesApp.workspace.get()
    }

    const activeModuleTab = activeModuleTabs.find(
      (tab) => tab.id === `${activeModule}-${activeSegment}`
    )

    layoutState.assign({
      activeModule,
      activeModuleTab,
      activePathPrefix,
      contextHeader: activeModuleTab?.title,
    })

    return activeModuleTabs
  }),
  canRenderHeaderContext: computed((): boolean => {
    const workspaceSlug = layoutState.workspaceSlug.get()
    const projectSlug = layoutState.projectSlug.get()

    if (!projectSlug && !workspaceSlug) {
      return false
    }

    return true
  }),
})
