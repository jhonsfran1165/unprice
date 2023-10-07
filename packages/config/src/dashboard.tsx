import type { DashboardRoute, ModulesApp } from "./types"

const submodulesWorkspace = ["overview", "statistics", "settings"] as const

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
      analytics: {
        title: "Analytics",
        icon: "Database",
        description: "Cabeza de nepe",
      },
    },
  },
  statistics: {
    icon: "BarChart2",
    titleTab: "Statistics",
    href: "/stadistics",
    disabled: true,
  },
  settings: {
    icon: "Settings",
    titleTab: "Settings",
    href: "/settings",
    disabled: false,
    tier: "FREE",
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
        subTabs: {
          billing: {
            title: "Billing",
            icon: "AppWindow",
            description: "Cabeza de AppWindow",
          },
          analytics: { title: "Analytics", icon: "Database" },
        },
      },
      danger: {
        title: "Danger",
        href: "/settings/danger",
        icon: "Warning",
        subTabs: {
          danger: {
            title: "Billing",
            icon: "AppWindow",
            description: "Cabeza de AppWindow",
          },
          analytics: { title: "Analytics", icon: "Database" },
        },
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
    subTabs: {
      overview: { title: "Analytics", icon: "Database" },
      analytics: { title: "Analytics", icon: "Database" },
    },
  },
  pro: {
    titleTab: "Pro Module",
    icon: "Receipt",
    href: "/pro",
    disabled: false,
    tier: "PRO",
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
    href: "/ingestions",
    disabled: true,
    sidebarMenu: {
      overview: {
        title: "General",
        href: "/overview",
        icon: "Settings",
        subTabs: {
          overview: { title: "Analytics", icon: "Database" },
          analytics: { title: "Analytics", icon: "Database" },
          Settings: { title: "Settings", icon: "Settings" },
        },
      },
      danger: {
        title: "Danger",
        href: "/danger",
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
    href: "/settings",
    icon: "Settings",
    sidebarMenu: {
      overview: {
        title: "General",
        href: "/settings/overview",
        icon: "Settings",
        subTabs: {
          overview: { title: "Analytics", icon: "Database" },
          analytics: { title: "Analytics", icon: "Database" },
          Settings: { title: "Settings", icon: "Settings" },
        },
      },
      danger: {
        title: "Danger",
        href: "/settings/danger",
        icon: "CreditCard",
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
