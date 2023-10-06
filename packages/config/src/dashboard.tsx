import type { DashboardRoute, ModulesApp } from "./types"

const submodulesWorkspace = ["overview", "statistics", "settings"] as const

const WorkspaceRoutes: Record<
  (typeof submodulesWorkspace)[number],
  DashboardRoute
> = {
  overview: {
    icon: "AppWindow",
    titleTab: "Projects",
    title: "Projects",
    description: "Projects for this workspace will show up here",
    href: "/overview",
    subTabs: {
      analytics: { title: "Analytics", icon: "Database" },
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
    action: {
      title: "dasdasd",
      type: "primary",
    },
    title: "General Settings",
    description: "Be careful dickhead",
    href: "/settings",
    disabled: false,
    tier: "FREE",
    sidebarMenu: {
      overview: {
        slug: "settings",
        title: "General",
        href: "/settings/overview",
        icon: "Settings",
        subTabs: {
          members: { title: "Members", icon: "User2" },
        },
      },
      billing: {
        slug: "billing",
        title: "Billing",
        href: "/settings/billing",
        icon: "CreditCard",
        subTabs: {
          analytics: { title: "Analytics", icon: "Database" },
        },
      },
      danger: {
        slug: "danger",
        title: "Danger",
        href: "/settings/danger",
        icon: "CreditCard",
        subTabs: {
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
    description: "Projects for this workspace will show up here",
    titleTab: "Dashboard",
    title: "Dashboard",
    icon: "Dashboard",
    href: "/overview",
    subTabs: {
      analytics: { title: "Analytics", icon: "Database" },
    },
  },
  pro: {
    titleTab: "Pro Module",
    title: "Dashboard",
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
  },
  apikeys: {
    title: "Api Keys",
    description: "Api Keys for you my friend",
    titleTab: "Api Keys",
    href: "/apikeys",
    icon: "Key",
  },
  settings: {
    titleTab: "Settings",
    href: "/settings",
    description: "Control your project here",
    title: "Settings",
    icon: "Settings",
    subTabs: {
      analytics: { title: "Analytics", icon: "Database" },
    },
    sidebarMenu: {
      settings: {
        slug: "settings",
        title: "General",
        href: "/settings/overview",
        icon: "Settings",
      },
      danger: {
        slug: "danger",
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
