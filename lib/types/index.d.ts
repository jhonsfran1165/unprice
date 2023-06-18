import type { Icon } from "lucide-react"

import type {
  OrganizationRoles,
  OrganizationTypes,
  SubscriptionTiers,
} from "@/lib/types/supabase"
import { Icons } from "@/components/icons"

export type AppModulesNav = {
  org: DashboardNavItem[]
  project: DashboardNavItem[]
}

export type AppOrgClaim = {
  role: OrganizationRoles
  slug: string
  tier: SubscriptionTiers
  is_default: boolean
  image: string
  type: OrganizationTypes
}

export type AppClaims = {
  current_org: {
    org_id: string
    org_slug: string
  }
  organizations: {
    [orgId: string]: AppOrgClaim
  }
}

export type GetActiveTabs = {
  tabs: DashboardNavItem[]
  activePathPrefix: string
  numberSegments: number
  activeSegment?: string
  cleanSegments: string[]
}

export interface RootDomainProps {
  target: string
  rewrite?: boolean
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
  tier?: string
  icon?: keyof typeof Icons
  href: string
}

export type DashboardNavItem = {
  title: string
  module: string
  submodule?: string
  slug: string
  href: string
  tier?: string
  sidebarNav?: DashboardSidebarNavItem[]
  disabled?: boolean
  external?: boolean
}

export type PriceSubscription = {
  amount: number
  currency: string
  priceIds: {
    test: string
    production: string
  }
}

export type SubscriptionPlan = {
  plan: SubscriptionTiers
  tagline: string
  copy: string
  clicksLimit?: string
  features: {
    text: string
    footnote?: string
    negative?: boolean
  }[]
  cta: string
  ctaLink: string
  limits: {
    views: number
    organizations: number
    projects: number
    users: number
  }
  price: { [id: string]: PriceSubscription }
}

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
