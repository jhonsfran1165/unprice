import { cache } from "react"

import { DashboardConfig } from "@/lib/types"

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Sites",
      href: "/",
    },
    {
      title: "Settings",
      href: "/settings",
      disabled: false,
      sidebarNav: [
        {
          title: "General",
          href: "/settings",
          icon: "post",
        },
        {
          title: "Billing",
          href: "/settings/billing",
          icon: "post",
        },
      ],
    },
  ],
  mainNavSites: [
    {
      title: "Pages",
      href: "/",
    },
    {
      title: "Settings",
      href: "/settings",
      disabled: false,
      sidebarNav: [
        {
          title: "General",
          href: "/",
          icon: "post",
        },
        {
          title: "Billing",
          href: "/billing",
          icon: "post",
          disabled: false,
        },
      ],
    },
  ],
  sidebarNav: [
    {
      title: "Posts",
      href: "/dashboard",
      icon: "post",
    },
    {
      title: "Pages",
      href: "",
      icon: "page",
      disabled: true,
    },
    {
      title: "Media",
      href: "",
      icon: "media",
      disabled: true,
    },
    {
      title: "Billing",
      href: "dashboard/billing",
      icon: "billing",
    },
    {
      title: "Settings",
      href: "dashboard/settings",
      icon: "settings",
    },
  ],
}

export function navBarBySlug(href: string | undefined) {
  // Assuming it always return expected dashboardconfigs
  return dashboardConfig.mainNav.find((item) => item.href === href)
}

export function navBarSiteBySlug(href: string | undefined) {
  // Assuming it always return expected dashboardconfigs
  return dashboardConfig.mainNavSites.find((item) => item.href === href)
}
