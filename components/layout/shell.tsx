"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { useStore } from "@/lib/stores/layout"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardShellSkeleton } from "@/components/layout/shell-skeleton"
import { DashboardSideBarNav } from "@/components/layout/sidebar-nav"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export function DashboardShell({
  children,
  isLoading,
}: {
  children?: ReactNode
  isLoading?: boolean
}) {
  const { activeTab, activePathPrefix } = useStore()
  const pathName = usePathname()
  const items = activeTab?.sidebarNav || []

  return (
    <ScrollArea>
      <MaxWidthWrapper className="max-w-screen-2xl pt-10">
        {isLoading ? (
          <DashboardShellSkeleton />
        ) : items ? (
          <div className="grid gap-5 md:grid-cols-[250px_1fr]">
            <aside className="min-w-full flex-col md:flex md:w-[250px]">
              <DashboardSideBarNav
                pathName={pathName ?? ""}
                items={items}
                pathPrefix={activePathPrefix}
              />
            </aside>
            <div className="flex w-full flex-1 flex-col">{children}</div>
          </div>
        ) : (
          <div className="flex w-full flex-1 flex-col">{children}</div>
        )}
      </MaxWidthWrapper>
    </ScrollArea>
  )
}
