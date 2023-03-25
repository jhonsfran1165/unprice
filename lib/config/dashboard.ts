import { cache } from "react"

import {
  AppModulesNav,
  DashboardNavItem,
  DashboardSidebarNavItem,
  GetActiveTabs,
} from "@/lib/types"

const OrgNavTabs: DashboardNavItem[] = [
  {
    module: "org",
    slug: "org-root",
    title: "Sites",
    href: "/",
  },
  {
    module: "org",
    slug: "org-stadistics",
    title: "Statistics",
    href: "/stadistics",
    disabled: true,
  },
  {
    module: "org",
    slug: "org-settings",
    title: "Settings",
    href: "/settings",
    disabled: false,
    sidebarNav: [
      {
        module: "org",
        submodule: "settings",
        slug: "org-settings",
        title: "General",
        href: "/settings",
        icon: "post",
      },
      {
        module: "org",
        submodule: "settings",
        slug: "org-settings-billing",
        title: "Billing",
        href: "/settings/billing",
        icon: "post",
      },
    ],
  },
]

const SiteNavTabs: DashboardNavItem[] = [
  {
    module: "site",
    slug: "site-root",
    title: "Pages",
    href: "/",
  },
  {
    module: "site",
    slug: "site-stadistics",
    title: "Statistics",
    href: "/stadistics",
    disabled: true,
  },
  {
    module: "site",
    slug: "site-settings",
    title: "Settings",
    href: "/settings",
    disabled: false,
    sidebarNav: [
      {
        module: "site",
        submodule: "settings",
        slug: "site-settings",
        title: "General",
        href: "/settings",
        icon: "post",
      },
      {
        module: "site",
        submodule: "settings",
        slug: "site-settings-billing",
        title: "Billing",
        href: "/settings/billing",
        icon: "post",
      },
    ],
  },
]

export const AppModules: AppModulesNav = {
  org: OrgNavTabs,
  site: SiteNavTabs,
}

export const getDashboardSidebarNavItems = cache(
  ({
    moduleNav,
    slug,
  }: {
    moduleNav: string
    slug: string
  }): DashboardSidebarNavItem[] => {
    const moduleTabs = AppModules[moduleNav]

    return moduleTabs?.find((item) => item.slug === slug)?.sidebarNav || []
  }
)

export const getActiveSegments = (segments, modules): number => {
  const moduleKeys = Object.keys(modules)
  let numberSegments = 0

  segments.map((segment) => {
    if (moduleKeys.includes(segment)) {
      numberSegments++
    }
  })

  return numberSegments
}

export const getActiveTabs = (
  segments: string[],
  appModules: AppModulesNav
): GetActiveTabs => {
  const numberSegments = getActiveSegments(segments, appModules)
  const moduleKeys = Object.keys(appModules)
  const ignoredRoutes = ["(dashboard)", "(auth)"]

  const cleanSegments = segments.filter(
    (segment) => !ignoredRoutes.includes(segment)
  )

  const activePathPrefix = `/${cleanSegments
    ?.slice(0, numberSegments * 2)
    .join("/")}`

  // reverse the order so I can get the last active segment
  const activeSegment = segments
    .slice()
    .reverse()
    .find((segment) => moduleKeys.includes(segment))

  return {
    tabs: activeSegment ? appModules[activeSegment] : [],
    activePathPrefix,
    numberSegments,
    activeSegment,
    cleanSegments,
  }
}
