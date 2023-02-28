import type { Icon } from "lucide-react"

import { Icons } from "@/components/icons"

export type NavItem = {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
}

export type MainNavItem = NavItem

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

// export type SiteConfig = {
//   name: string
//   links: {
//     twitter: string
//     github: string
//   }
// }

// export type DocsConfig = {
//   mainNav: MainNavItem[]
//   sidebarNav: SidebarNavItem[]
// }

// export type MarketingConfig = {
//   mainNav: MainNavItem[]
// }

type MainNavItem2 = {
  title: string
  href?: string
  sidebarNav?: SidebarNavItem[]
  disabled?: boolean
  external?: boolean
}

export type DashboardConfig = {
  mainNav: MainNavItem2[]
  mainNavSites: MainNavItem2[]
  sidebarNav: SidebarNavItem[]
}

export type SubscriptionPlan = {
  name: string
  description: string
  stripePriceId: string
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
