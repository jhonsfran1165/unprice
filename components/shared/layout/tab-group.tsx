"use client"

import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { getDashboardMainNavItem } from "@/lib/config/dashboard"
import type { DashboardNavItem } from "@/lib/types/index"
import { Tab } from "@/components/shared/layout/tab"

export const TabGroup = () => {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()

  let items: DashboardNavItem[] = []
  let path: string = ""

  if (pathname?.startsWith("/site")) {
    path = `/${segments?.slice(0, 2).join("/")}` // /site/1/
    items = getDashboardMainNavItem({
      moduleNav: "site",
      pathPrefix: path,
    })
  } else {
    items = getDashboardMainNavItem({
      moduleNav: "main",
      pathPrefix: "",
    })
  }

  if (items?.length === 0 || items === undefined) {
    return null
  }

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <Tab key={path + index} item={item} path={path} />
      ))}
    </nav>
  )
}
