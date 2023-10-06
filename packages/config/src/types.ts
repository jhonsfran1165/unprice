import type * as Icons from "@builderai/ui/icons"

export interface ModulesApp {
  moduleTabs: DashboardRoute[]
  activeTab: DashboardRoute | null
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
  subTabs?: SubTabsRoutes
}

export interface SubTabRoute {
  title: string
  icon?: keyof typeof Icons
}

export type SubTabsRoutes = Record<string, SubTabRoute>
export type SidebarRoutes = Record<string, DashboardSidebarRoute>

export interface DashboardRoute {
  titleTab: string
  title?: string
  action?: {
    title: string
    type: string
  }
  icon?: keyof typeof Icons
  description?: string
  href: string
  tier?: string
  sidebarMenu?: SidebarRoutes
  disabled?: boolean
  external?: boolean
  tabsDisabled?: boolean
  subTabs?: SubTabsRoutes
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
