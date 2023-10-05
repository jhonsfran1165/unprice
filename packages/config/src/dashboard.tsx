import type { DashboardRoute, ModulesApp, SidebarRoutes } from "./types"

const submodulesWorkspace = ["overview", "statistics", "settings"] as const

const WorkspaceRoutes: Record<
  (typeof submodulesWorkspace)[number],
  DashboardRoute
> = {
  overview: {
    submodule: "overview",
    titleTab: "Projects",
    title: "Projects",
    description: "Projects for this workspace will show up here",
    slug: "overview",
    href: "/overview",
    breadcrumbRoutes: {
      analytics: "Analytics",
      reports: "Reports",
      notifications: "Notifications",
    },
  },
  statistics: {
    titleTab: "Statistics",
    submodule: "",
    slug: "stadistics",
    dashboardHeader: {
      title: "Statistics",
    },
    href: "/stadistics",
    disabled: true,
  },
  settings: {
    titleTab: "Settings",
    action: {
      title: "dasdasd",
      type: "primary",
    },
    title: "General Settings",
    description: "Be careful dickhead",
    submodule: "settings",
    slug: "settings",
    dashboardHeader: {
      title: "Settings",
    },
    href: "/settings",
    disabled: false,
    tier: "FREE",
    breadcrumbRoutes: {
      analytics: "Analytics",
      reports: "Reports",
      notifications: "Notifications",
    },
    sidebarRoutes: {
      settings: {
        slug: "settings",
        title: "General",
        href: "/settings/overview",
        icon: "Settings",
        breadcrumbRoutes: {
          analytics: "Analytics",
          reports: "Reports",
          notifications: "Notifications",
        },
      },
      billing: {
        slug: "billing",
        title: "Billing",
        href: "/settings/billing",
        icon: "CreditCard",
        breadcrumbRoutes: {
          analytics: "Analytics",
          reports: "Reports",
          notifications: "Notifications",
        },
      },
      danger: {
        slug: "danger",
        title: "Danger",
        href: "/settings/danger",
        icon: "CreditCard",
        breadcrumbRoutes: {
          analytics: "Analytics",
          reports: "Reports",
          notifications: "Notifications",
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
] as const

const ProjectRoutes: Record<
  (typeof submodulesProject)[number],
  DashboardRoute
> = {
  overview: {
    slug: "project-overview",
    submodule: "overview",
    description: "Projects for this workspace will show up here",
    titleTab: "Dashboard",
    dashboardHeader: {
      title: "Dashboard",
    },
    href: "/overview",
    breadcrumbRoutes: {
      overview: "Overview",
      analytics: "Analytics",
      reports: "Reports",
      notifications: "Notifications",
    },
  },
  pro: {
    submodule: "pro",
    slug: "project-pro",
    titleTab: "Pro Module",
    dashboardHeader: {
      title: "Pro Module",
    },
    href: "/pro",
    disabled: false,
    tier: "PRO",
  },
  statistics: {
    slug: "project-statistics",
    submodule: "statistics",
    titleTab: "Statistics",
    dashboardHeader: {
      title: "Statistics",
    },
    href: "/statistics",
    disabled: true,
  },
  apikeys: {
    slug: "project-apikeys",
    submodule: "apikeys",
    title: "Projects",
    description: "Projects for this workspace will show up here",
    titleTab: "Api Keys",
    dashboardHeader: {
      title: "Api Keys",
    },
    href: "/apikeys",
  },
  settings: {
    slug: "project-settings",
    submodule: "settings",
    titleTab: "Settings",
    dashboardHeader: {
      title: "Settings",
    },
    href: "/settings",
    disabled: false,
    title: "Settings",
    breadcrumbRoutes: {
      analytics: "Analytics",
      reports: "Reports",
      notifications: "Notifications",
    },
    sidebarRoutes: {
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
  const moduleRoutes = Object.values(moduleConfig)
  const activeModuleRoute = (moduleConfig[submodule] as DashboardRoute) ?? null

  const submoduleConfig =
    activeModuleRoute?.sidebarRoutes ?? ({} as SidebarRoutes)
  const submoduleRoutes = Object.values(submoduleConfig)
  const activeSubmoduleRoute = null

  return {
    moduleRoutes,
    submoduleRoutes,
    activeModuleRoute: activeModuleRoute,
    activeSubModuleRoute: activeSubmoduleRoute,
  }
}
