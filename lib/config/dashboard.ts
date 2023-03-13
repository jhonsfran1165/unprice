import { cache } from "react"

import { DashboardNavItem, DashboardSidebarNavItem } from "@/lib/types"

const MainNavItems = (pathPrefix: string): DashboardNavItem[] => {
  return [
    {
      module: "main",
      slug: "main-root",
      title: "Sites",
      href: `${pathPrefix}/`,
    },
    {
      module: "main",
      slug: "main-stadistics",
      title: "Statistics",
      href: `${pathPrefix}/stadistics`,
      disabled: true,
    },
    {
      module: "main",
      slug: "main-settings",
      title: "Settings",
      href: `${pathPrefix}/settings`,
      disabled: false,
      sidebarNav: [
        {
          module: "main",
          submodule: "settings",
          slug: "main-settings",
          title: "General",
          href: `${pathPrefix}/settings`,
          icon: "post",
        },
        {
          module: "main",
          submodule: "settings",
          slug: "main-settings-billing",
          title: "Billing",
          href: `${pathPrefix}/settings/billing`,
          icon: "post",
        },
      ],
    },
  ]
}

const SiteNavItems = (pathPrefix: string): DashboardNavItem[] => {
  return [
    {
      module: "site",
      slug: "sites-root",
      title: "Pages",
      href: `${pathPrefix}/`,
    },
    {
      module: "site",
      slug: "sites-stadistics",
      title: "Stadistics",
      href: `${pathPrefix}/stadistics`,
    },
    {
      module: "site",
      slug: "sites-settings",
      title: "Settings",
      href: `${pathPrefix}/settings`,
      disabled: false,
      sidebarNav: [
        {
          module: "site",
          submodule: "settings",
          slug: "sites-settings",
          title: "General",
          href: `${pathPrefix}/settings`,
          icon: "post",
        },
        {
          module: "site",
          submodule: "settings",
          slug: "sites-settings-billing",
          title: "Billing",
          href: `${pathPrefix}/settings/billing`,
          icon: "post",
          disabled: false,
        },
      ],
    },
  ]
}

export const getDashboardSidebarNavItems = cache(
  ({
    moduleNav,
    slug,
    pathPrefix,
  }: {
    moduleNav: string
    slug: string
    pathPrefix: string
  }): DashboardSidebarNavItem[] => {
    const mainNavItems: DashboardNavItem[] = MainNavItems("")
    const siteNavItems: DashboardNavItem[] = SiteNavItems(pathPrefix)
    const items: DashboardNavItem[] = [...mainNavItems, ...siteNavItems]

    return (
      items?.find((item) => item.module === moduleNav && item.slug === slug)
        ?.sidebarNav || []
    )
  }
)

export const getDashboardMainNavItem = cache(
  ({
    moduleNav,
    pathPrefix,
  }: {
    moduleNav: string
    pathPrefix: string
  }): DashboardNavItem[] => {
    const mainNavItems: DashboardNavItem[] = MainNavItems(pathPrefix)
    const siteNavItems: DashboardNavItem[] = SiteNavItems(pathPrefix)
    const items: DashboardNavItem[] = [...mainNavItems, ...siteNavItems]

    return items?.filter((item) => item.module === moduleNav) || []
  }
)
