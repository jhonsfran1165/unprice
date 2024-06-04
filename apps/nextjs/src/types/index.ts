import * as Icons from "@builderai/ui/icons"

export interface RootDomainProps {
  target: string
  rewrite?: boolean
}

export interface SidebarRoute {
  title: string
  action?: JSX.Element
  description?: string
  disabled?: boolean
  tier?: string
  icon: keyof typeof Icons
  href: string
}

export interface SubTabRoute {
  title: string
  icon?: keyof typeof Icons
  action?: JSX.Element
  description?: string
}

export type SubTabsRoutes = Record<string, SubTabRoute>
export type SidebarRoutes = Record<string, SidebarRoute>

export interface DashboardRoute {
  titleTab: string
  isNew?: boolean
  href: string
  disabled?: boolean
  icon: keyof typeof Icons
  sidebar?: SidebarRoutes
  // we can use this for further customization from here
  // testing?: JSX.Element
}

export interface Route {
  title: string
  href: string
  disabled?: boolean
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

export function isSidebarRoute(item: object | undefined): item is SidebarRoute {
  return (item as SidebarRoute) !== undefined
}
export function isSubTabsRoutes(item: object | undefined): item is SubTabsRoutes {
  return (item as SubTabsRoutes) !== undefined
}

export const createIcon = (name: keyof typeof Icons): Icons.LucideIcon =>
  Icons[name] as Icons.LucideIcon
