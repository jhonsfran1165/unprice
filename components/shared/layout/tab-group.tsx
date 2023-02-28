"use client"

import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { dashboardConfig } from "@/config/dashboard"
import { Tab } from "@/components/shared/layout/tab"

export const TabGroup = () => {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()

  const navItems = pathname.startsWith("/site")
    ? dashboardConfig.mainNavSites
    : dashboardConfig.mainNav

  const path = pathname.startsWith("/site")
    ? `/${segments.slice(0, 2).join("/")}`
    : ""

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {navItems.map((item, index) => (
        <Tab key={path + index} item={item} path={path} />
      ))}
    </nav>
  )
}
