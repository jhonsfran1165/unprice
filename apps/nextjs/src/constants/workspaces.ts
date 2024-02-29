import type { DashboardRoute } from "~/types"

const submodulesWorkspace = [
  "overview",
  "settings",
  "domains",
  "dashboard",
] as const

export const WORKSPACE_TABS_CONFIG: Record<
  (typeof submodulesWorkspace)[number],
  DashboardRoute
> = {
  overview: {
    icon: "AppWindow",
    titleTab: "Projects",
    href: "/overview",
  },
  dashboard: {
    icon: "Dashboard",
    titleTab: "Dashboard",
    href: "/dashboard",
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
    sidebar: {
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
