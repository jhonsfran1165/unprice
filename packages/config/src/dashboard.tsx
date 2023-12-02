import type { DashboardRoute } from "./types"

const submodulesWorkspace = [
  "overview",
  "statistics",
  "settings",
  "domains",
] as const

const WorkspaceRoutes: Record<
  (typeof submodulesWorkspace)[number],
  DashboardRoute
> = {
  overview: {
    icon: "AppWindow",
    titleTab: "Projects",
    href: "/overview",
    subTabs: {
      overview: {
        title: "Projects",
        icon: "AppWindow",
        description: "Cabeza de AppWindow",
      },
    },
  },
  statistics: {
    icon: "BarChart2",
    titleTab: "Statistics",
    href: "/stadistics",
    disabled: true,
  },
  domains: {
    icon: "Globe",
    titleTab: "Domains",
    href: "/domains",
  },
  settings: {
    icon: "Settings",
    titleTab: "Settings",
    href: "/settings/overview",
    disabled: false,
    sidebarMenu: {
      overview: {
        title: "General",
        href: "/settings/overview",
        icon: "Settings",
        subTabs: {
          overview: {
            title: "Organization",
            icon: "AppWindow",
            description: "Cabeza de AppWindow",
          },
          members: {
            title: "Members",
            icon: "User2",
            description: "Cabeza de AppWindow",
          },
        },
      },
      billing: {
        title: "Billing",
        href: "/settings/billing",
        icon: "CreditCard",
      },
      danger: {
        title: "Danger",
        href: "/settings/danger",
        icon: "Warning",
      },
    },
  },
}

const submodulesProject = [
  "overview",
  "pro",
  "statistics",
  "apikeys",
  "settings",
  "ingestions",
] as const

const ProjectRoutes: Record<
  (typeof submodulesProject)[number],
  DashboardRoute
> = {
  overview: {
    titleTab: "Dashboard",
    icon: "Dashboard",
    href: "/overview",
  },
  pro: {
    titleTab: "Canvas",
    icon: "Receipt",
    href: "/pro",
    disabled: false,
    isNew: true,
  },
  statistics: {
    titleTab: "Statistics",
    icon: "BarChart2",
    href: "/statistics",
    disabled: true,
  },
  ingestions: {
    titleTab: "ingestions",
    icon: "BarChartIcon",
    href: "/ingestions/overview",
    disabled: true,
    sidebarMenu: {
      overview: {
        title: "General",
        href: "/ingestions/overview",
        icon: "Settings",
      },
      danger: {
        title: "Danger",
        href: "/ingestions/danger",
        icon: "CreditCard",
      },
    },
  },
  apikeys: {
    titleTab: "Api Keys",
    href: "/apikeys",
    icon: "Key",
  },
  settings: {
    titleTab: "Settings",
    href: "/settings/overview",
    icon: "Settings",
    sidebarMenu: {
      overview: {
        title: "General",
        href: "/settings/overview",
        icon: "Settings",
      },
      danger: {
        title: "Danger",
        href: "/settings/danger",
        icon: "Warning",
      },
    },
  },
}

export type TruthyKeys<T> = keyof {
  [K in keyof T as T[K] extends true ? never : K]: K
}

type WorkspaceModulesType = TruthyKeys<typeof WorkspaceRoutes>
type ProjectModulesType = TruthyKeys<typeof ProjectRoutes>

const allModuleRoutesApp: {
  workspace: Record<WorkspaceModulesType, DashboardRoute>
  project: Record<ProjectModulesType, DashboardRoute>
} = {
  workspace: WorkspaceRoutes,
  project: ProjectRoutes,
}

export type ModuleApp = keyof typeof allModuleRoutesApp
export type SubModuleApp<T extends ModuleApp> =
  keyof (typeof allModuleRoutesApp)[T]

export interface ModulesApp {
  moduleTabs: DashboardRoute[]
  activeTab: DashboardRoute | null
}

export const getModulesApp = <T extends ModuleApp>({
  module,
  submodule,
}: {
  module: T
  submodule: SubModuleApp<T>
}): ModulesApp => {
  const moduleConfig = allModuleRoutesApp[module]
  const moduleTabs = Object.values(moduleConfig)
  const activeTab = (moduleConfig[submodule] as DashboardRoute) ?? null

  return {
    moduleTabs,
    activeTab,
  }
}
