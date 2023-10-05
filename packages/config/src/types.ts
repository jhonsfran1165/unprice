import type * as Icons from "@builderai/ui/icons"

export interface ModulesApp {
  moduleRoutes: DashboardRoute[]
  submoduleRoutes: DashboardSidebarRoute[]
  activeModuleRoute: DashboardRoute | null
  activeSubModuleRoute: DashboardSidebarRoute | null
}

export interface RootDomainProps {
  target: string
  rewrite?: boolean
}

export interface DashboardSidebarRoute {
  title?: string
  slug: string
  disabled?: boolean
  external?: boolean
  tier?: string
  icon: keyof typeof Icons
  href: string
  breadcrumbRoutes?: BreadcrumbRoutes
}

export interface DashboardHeader {
  title: string
  actionLink?: string
  actionColor?: string
}

export type BreadcrumbRoutes = Record<string, string>
export type SidebarRoutes = Record<string, DashboardSidebarRoute>

export interface DashboardRoute {
  dashboardHeader?: DashboardHeader
  titleTab: string
  title?: string
  action?: {
    title: string
    type: string
  }
  description?: string
  submodule: string
  slug: string
  href: string
  tier?: string
  sidebarRoutes?: SidebarRoutes
  disabled?: boolean
  external?: boolean
  tabsDisabled?: boolean
  breadcrumbRoutes?: BreadcrumbRoutes
}

export interface Route {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
}

export interface SiteConfig {
  name: string
  description: string
  mainNav: Route[]
  links: {
    twitter: string
    github: string
    dashboard: string
  }
}
