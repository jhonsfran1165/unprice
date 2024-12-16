import { Dashboard } from "@unprice/ui/icons"
import { BarChartIcon, Calculator, Key, Link, Settings, Sticker, Users } from "lucide-react"
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
    name: "Pages",
    icon: Sticker,
    href: "/pages",
  },
  {
    name: "Usage",
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
    name: "Customers & Subs",
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
      {
        name: "Payment Provider",
        href: "/settings/payment",
      },
    ],
  },
]

export const PROJECT_SHORTCUTS = [
  {
    name: "See Plans",
    href: "plans",
    icon: Link,
  },
  {
    name: "Create Subscription",
    href: "customers/subscriptions/new",
    icon: Link,
  },
  {
    name: "All Customers",
    href: "customers",
    icon: Link,
  },
]
