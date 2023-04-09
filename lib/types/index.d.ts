import type { Icon } from "lucide-react"

import { Icons } from "@/components/icons"

export type AppModulesNav = {
  org: DashboardNavItem[]
  project: DashboardNavItem[]
}

export type GetActiveTabs = {
  tabs: DashboardNavItem[]
  activePathPrefix: string
  numberSegments: number
  activeSegment?: string
  cleanSegments: string[]
}

export type SidebarNavItem = {
  title: string
  disabled?: boolean
  external?: boolean
  icon?: keyof typeof Icons
} & (
  | {
      href: string
      items?: never
    }
  | {
      href?: string
      items: NavLink[]
    }
)

export type DashboardSidebarNavItem = {
  title: string
  module: string
  submodule: string
  slug: string
  disabled?: boolean
  external?: boolean
  icon?: keyof typeof Icons
  href: string
}

export type DashboardNavItem = {
  title: string
  module: string
  submodule?: string
  slug: string
  href: string
  sidebarNav?: DashboardSidebarNavItem[]
  disabled?: boolean
  external?: boolean
}

export type SubscriptionPlan = {
  name: string
  description: string
  stripePriceId?: string
}

export interface RootDomainProps {
  target: string
  rewrite?: boolean
}

// export type UserSubscriptionPlan = SubscriptionPlan &
//   Pick<User, "stripeCustomerId" | "stripeSubscriptionId"> & {
//     stripeCurrentPeriodEnd: number
//     isPro: boolean
//   }

export type NavItem = {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
}

export interface LayoutConfig {
  name: string
  description: string
  mainNav: NavItem[]
  links: {
    twitter: string
    github: string
    dashboard: string
  }
}
