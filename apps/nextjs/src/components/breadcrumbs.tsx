"use client"

import Link from "next/link"

import type { BreadcrumbRoutes } from "@builderai/config"
import { cn } from "@builderai/ui"

import { useGetPaths } from "~/lib/use-get-path"

export default function Breadcrumbs({
  breadcrumbRoutes,
  routeSlug,
}: {
  breadcrumbRoutes: BreadcrumbRoutes
  routeSlug: string
}) {
  const activePathPrefix = useGetPaths()
  // TODO: support nested submodules

  return (
    <div className="mb-4 inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
      {Object.entries(breadcrumbRoutes).map(([key, value]) => {
        const isActive =
          key === routeSlug || (key !== "" && routeSlug.endsWith(key))
        return (
          <Link
            key={key}
            href={`${activePathPrefix}/${routeSlug}/${key}`}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive && "bg-background text-foreground shadow-sm"
            )}
          >
            {value}
          </Link>
        )
      })}
    </div>
  )
}
