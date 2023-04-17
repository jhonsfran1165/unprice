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
    title: "Projects",
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
        icon: "settings",
      },
      {
        module: "org",
        submodule: "settings",
        slug: "org-settings-billing",
        title: "Billing",
        href: "/settings/billing",
        icon: "billing",
      },
      {
        module: "org",
        submodule: "settings",
        slug: "org-settings-members",
        title: "Members",
        href: "/settings/members",
        icon: "users",
      },
    ],
  },
]

const ProjectNavTabs: DashboardNavItem[] = [
  {
    module: "project",
    slug: "project-root",
    title: "Pages",
    href: "/",
  },
  {
    module: "project",
    slug: "project-stadistics",
    title: "Statistics",
    href: "/stadistics",
    disabled: true,
  },
  {
    module: "project",
    slug: "project-settings",
    title: "Settings",
    href: "/settings",
    disabled: false,
    sidebarNav: [
      {
        module: "project",
        submodule: "settings",
        slug: "project-settings",
        title: "General",
        href: "/settings",
        icon: "post",
      },
      {
        module: "project",
        submodule: "settings",
        slug: "project-settings-billing",
        title: "Billing",
        href: "/settings/billing",
        icon: "post",
      },
    ],
  },
]

export const AppModules: AppModulesNav = {
  org: OrgNavTabs,
  project: ProjectNavTabs,
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
  const ignoredRoutes = ["(dashboard)", "(auth)", "root"]

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
