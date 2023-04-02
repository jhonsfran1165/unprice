"use client"

import { ReactNode } from "react"

import { useStore } from "@/lib/stores/layout"
import type { DashboardSidebarNavItem } from "@/lib/types"
import { DashboardShellSkeleton } from "@/components/dashboard/shell-skeleton"
import { DashboardSideBarNav } from "@/components/dashboard/sidebar-nav"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DashboardShell({
  children,
  isLoading,
}: {
  children?: ReactNode
  isLoading?: boolean
}) {
  const { activeTab, activePathPrefix } = useStore()
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
