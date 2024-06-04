import type { DashboardRoute } from "~/types"

const submodulesWorkspace = ["overview", "settings", "domains"] as const

// TODO: improve icons
export const WORKSPACE_TABS_CONFIG: Record<(typeof submodulesWorkspace)[number], DashboardRoute> = {
  overview: {
    icon: "AppWindow",
    titleTab: "Projects",
    href: "/overview",
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
      },
      members: {
        title: "Members",
        href: "/settings/members",
        icon: "User2",
        description: "Cabeza de AppWindow",
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
