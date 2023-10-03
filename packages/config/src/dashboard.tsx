import * as Icons from "@builderai/ui/icons"

import type { DashboardNavItem, ModulesAppNav } from "./types"

const WorkspaceNavTabs: DashboardNavItem[] = [
  {
    module: "workspace",
    titleTab: "Projects",
    id: "workspace-overview",
    href: "/overview",
  },
  {
    module: "workspace",
    id: "workspace-stadistics",
    title: "Statistics",
    href: "/stadistics",
    disabled: true,
  },
  {
    module: "workspace",
    id: "workspace-settings",
    title: "Settings",
    href: "/settings",
    disabled: false,
    tier: "FREE",
    sidebarNav: [
      {
        module: "workspace",
        submodule: "settings",
        id: "workspace-settings",
        title: "General",
        href: "/settings",
        icon: Icons.Settings,
      },
      {
        module: "workspace",
        submodule: "settings",
        id: "workspace-settings-billing",
        title: "Billing",
        href: "/settings/billing",
        icon: Icons.CreditCard,
      },
      {
        module: "workspace",
        submodule: "settings",
        id: "workspace-settings-danger",
        title: "Danger",
        href: "/settings/danger",
        icon: Icons.Warning,
      },
    ],
  },
]

const ProjectNavTabs: DashboardNavItem[] = [
  {
    module: "project",
    id: "project-overview",
    title: "Dashboard",
    href: "/overview",
    breadcrumbs: {
      overview: "Overview",
      analytics: "Analytics",
      reports: "Reports",
      notifications: "Notifications",
    },
  },
  {
    module: "project",
    id: "project-pro",
    title: "Pro module",
    href: "/pro",
    disabled: false,
    tier: "PRO",
  },
  {
    module: "project",
    id: "project-stadistics",
    title: "Statistics",
    href: "/stadistics",
    disabled: true,
  },
  {
    module: "project",
    id: "project-apikey",
    title: "Api Keys",
    href: "/apikeys",
  },
  {
    module: "project",
    id: "project-settings",
    title: "Settings",
    href: "/settings",
    disabled: false,
    sidebarNav: [
      {
        module: "project",
        submodule: "settings",
        id: "project-settings",
        title: "General",
        href: "/settings",
        icon: Icons.Settings,
      },
      {
        module: "project",
        submodule: "settings",
        id: "project-settings-danger",
        title: "Danger",
        href: "/settings/danger",
        icon: Icons.Warning,
      },
    ],
  },
]

export const getModulesApp = (): ModulesAppNav => ({
  workspace: WorkspaceNavTabs,
  project: ProjectNavTabs,
})
