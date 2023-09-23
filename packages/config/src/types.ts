export type AppModulesNav = {
  workspace: DashboardNavItem[]
  project: DashboardNavItem[]
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

export type DashboardSidebarNavItem = {
  title: string
  module: string
  submodule: string
  slug: string
  disabled?: boolean
  external?: boolean
  tier?: string
  icon?: any
  href: string
}

export type DashboardNavItem = {
  title: string
  titleTab?: string
  module: string
  submodule?: string
  slug: string
  href: string
  tier?: string
  sidebarNav?: DashboardSidebarNavItem[]
  disabled?: boolean
  external?: boolean
  headerDisabled?: boolean
  tabsDisabled?: boolean
}

export type PriceSubscription = {
  amount: number
  currency: string
  priceIds: {
    test: string
    production: string
  }
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
