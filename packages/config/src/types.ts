export interface ModulesAppNav {
  workspace: DashboardNavItem[]
  project: DashboardNavItem[]
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
  icon: JSX.Element
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
