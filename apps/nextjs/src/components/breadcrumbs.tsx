"use client"

import Link from "next/link"

import type { DashboardRoute } from "@builderai/config"
import { cn } from "@builderai/ui"

import { useGetPaths } from "~/lib/use-get-path"

export default function Breadcrumbs({
  route,
  activeModuleTabRoute,
}: {
  route: string
  activeModuleTabRoute: DashboardRoute | null
}) {
  const { baseUrl, pathname, restUrl } = useGetPaths() // get hte prefix of the dynamic slugs

  // give a path prefix calculate sidebar tabs
  const activeSideBarRouteSlug = restUrl.replace(`${route}/`, "").split("/")[0]!

  const sideBarRoutes = activeModuleTabRoute?.sidebarRoutes
  const activeSideBarRoute = sideBarRoutes?.[activeSideBarRouteSlug]

  const activeBreadCrumbs =
    activeSideBarRoute?.breadcrumbRoutes ??
    activeModuleTabRoute?.breadcrumbRoutes ??
    []

  // only add sidebar prefix is there a sidebar
  const baseUrlSidebar = sideBarRoutes
    ? `${baseUrl}/${route}/${activeSideBarRouteSlug}`
    : `${baseUrl}/${route}`

  if (activeBreadCrumbs.length === 0) return null

  return (
    <div className="mb-4 inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
      <Link
        href={`${baseUrlSidebar}`}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          baseUrlSidebar === pathname &&
            "bg-background text-foreground shadow-sm"
        )}
      >
        {activeSideBarRoute?.title ?? activeModuleTabRoute?.title}
      </Link>
      {Object.entries(activeBreadCrumbs).map(([key, value]) => {
        return (
          <Link
            key={key}
            href={`${baseUrlSidebar}/${key}`}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              `${baseUrlSidebar}/${key}` === pathname &&
                "bg-background text-foreground shadow-sm"
            )}
          >
            {value}
          </Link>
        )
      })}
    </div>
  )
}
