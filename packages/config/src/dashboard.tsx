import type { DashboardRoute, DashboardSidebarRoute, ModulesApp } from "./types"

const WorkspaceRouter: DashboardRoute[] = [
  {
    module: "workspace",
    titleTab: "Projects",
    slug: "overview",
    href: "/overview",
  },
  {
    module: "workspace",
    titleTab: "Statistics",
    slug: "stadistics",
    dashboardHeader: {
      title: "Statistics",
    },
    href: "/stadistics",
    disabled: true,
  },
  {
    module: "workspace",
    titleTab: "Settings",
    slug: "settings",
    dashboardHeader: {
      title: "Settings",
    },
    href: "/settings",
    disabled: false,
    tier: "FREE",
    dashboardSidebarRoutes: [
      {
        module: "workspace",
        submodule: "settings",
        slug: "settings",
        title: "General",
        href: "/settings",
        icon: "Settings",
      },
      {
        module: "workspace",
        submodule: "settings",
        slug: "billing",
        title: "Billing",
        href: "/settings/billing",
        icon: "CreditCard",
      },
      {
        module: "workspace",
        submodule: "settings",
        slug: "danger",
        title: "Danger",
        href: "/settings/danger",
        icon: "CreditCard",
      },
    ],
  },
]

const ProjectRouter: DashboardRoute[] = [
  {
    module: "project",
    slug: "overview",
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
  {
    module: "project",
    slug: "pro",
    titleTab: "Pro Module",
    dashboardHeader: {
      title: "Pro Module",
    },
    href: "/pro",
    disabled: false,
    tier: "PRO",
  },
  {
    module: "project",
    slug: "statistics",
    titleTab: "Statistics",
    dashboardHeader: {
      title: "Statistics",
    },
    href: "/statistics",
    disabled: true,
  },
  {
    module: "project",
    slug: "apikey",
    titleTab: "Api Keys",
    dashboardHeader: {
      title: "Api Keys",
    },
    href: "/apikeys",
  },
  {
    module: "project",
    slug: "settings",
    titleTab: "Settings",
    dashboardHeader: {
      title: "Settings",
    },
    href: "/settings",
    disabled: false,
    dashboardSidebarRoutes: [
      {
        module: "project",
        submodule: "settings",
        slug: "settings",
        title: "General",
        href: "/settings",
        icon: "Settings",
      },
      {
        module: "project",
        submodule: "settings",
        slug: "danger",
        title: "Danger",
        href: "/settings/danger",
        icon: "CreditCard",
      },
    ],
  },
]

// TODO: do not export directly
export const allModuleRoutesApp: {
  workspace: DashboardRoute[]
  project: DashboardRoute[]
} = {
  workspace: WorkspaceRouter,
  project: ProjectRouter,
}

export type ModuleApp = keyof typeof allModuleRoutesApp

export const getModulesApp = ({
  module,
  submodule,
  routeSlug,
}: {
  module: ModuleApp
  routeSlug: string
  submodule?: string
}): ModulesApp => {
  const moduleRoutes = allModuleRoutesApp[module]

  const submoduleRoutes = moduleRoutes.reduce(
    (routes: DashboardSidebarRoute[], item) => {
      if (item?.dashboardSidebarRoutes) {
        const moduleRoutes =
          item.dashboardSidebarRoutes?.filter(
            (item) => item.submodule === submodule
          ) ?? []
        return routes.concat(moduleRoutes)
      }
      return routes
    },
    []
  )

  const activeSubmoduleRoute =
    submoduleRoutes?.find((item) => item.slug === routeSlug) ?? null

  const activeModuleRoute =
    moduleRoutes?.find(
      (item) => item.slug === routeSlug || item.slug === submodule
    ) ?? null

  return {
    moduleRoutes,
    submoduleRoutes,
    activeModuleRoute: activeModuleRoute,
    activeSubModuleRoute: activeSubmoduleRoute,
  }
}
