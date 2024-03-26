import type { DashboardRoute } from "~/types"

const submodulesProject = [
  "overview",
  "plans",
  "apikeys",
  "usage",
  "customers",
  "settings",
] as const

export const PROJECT_TABS_CONFIG: Record<
  (typeof submodulesProject)[number],
  DashboardRoute
> = {
  overview: {
    titleTab: "Dashboard",
    icon: "Dashboard",
    href: "/overview",
  },
  plans: {
    titleTab: "Plans",
    icon: "Calculator",
    href: "/plans",
    disabled: false,
    isNew: true,
  },
  usage: {
    titleTab: "usage",
    icon: "BarChartIcon",
    href: "/ingestions/overview",
    disabled: true,
    sidebar: {
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
  customers: {
    titleTab: "Customers",
    href: "/customers/overview",
    icon: "User2",
    sidebar: {
      overview: {
        title: "Customers",
        href: "/customers/overview",
        icon: "User2",
      },
    },
  },
  settings: {
    titleTab: "Settings",
    href: "/settings/overview",
    icon: "Settings",
    sidebar: {
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
