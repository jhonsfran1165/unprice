import type { LucideIcon } from "@builderai/ui/icons"

export interface ModulesAppNav {
  workspace: DashboardNavItem[]
  project: DashboardNavItem[]
}

export interface GetActiveTabs {
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

export interface DashboardSidebarNavItem {
  title?: string
  module: string
  submodule: string
  id: string
  disabled?: boolean
  external?: boolean
  tier?: string
  icon: LucideIcon
  href: string
}

export interface DashboardNavItem {
  title?: string
  titleTab?: string
  module: string
  submodule?: string
  id: string
  href: string
  tier?: string
  sidebarNav?: DashboardSidebarNavItem[]
  disabled?: boolean
  external?: boolean
  tabsDisabled?: boolean
  breadcrumbs?: Record<string, string>
}

export interface PriceSubscription {
  amount: number
  currency: string
  priceIds: {
    test: string
    production: string
  }
}

export interface NavItem {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
}

export interface SiteConfig {
  name: string
  description: string
  mainNav: NavItem[]
  links: {
    twitter: string
    github: string
    dashboard: string
  }
}
