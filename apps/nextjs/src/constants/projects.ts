import { Dashboard } from "@builderai/ui/icons"
import { BarChartIcon, Calculator, Key, Link, Settings, Users } from "lucide-react"
import type { DashboardRoute } from "~/types"

export const PROJECT_NAV: DashboardRoute[] = [
  {
    name: "Dashboard",
    icon: Dashboard,
    href: "/",
  },
  {
    name: "Plans",
    icon: Calculator,
    href: "/plans",
    disabled: false,
    isNew: true,
  },
  {
    name: "usage",
    icon: BarChartIcon,
    href: "/ingestions",
    disabled: true,
  },
  {
    name: "Api Keys",
    href: "/apikeys",
    icon: Key,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    sidebar: [
      {
        name: "Danger",
        href: "/settings/danger",
      },
    ],
  },
]

export const PROJECT_SHORTCUTS = [
  {
    name: "Add Plan",
    href: "/",
    icon: Link,
  },
  {
    name: "Subscribe to plan",
    href: "#",
    icon: Link,
  },
  {
    name: "Add Customer",
    href: "#",
    icon: Link,
  },
]
