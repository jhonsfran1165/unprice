import { ReactNode } from "react"

import type { SidebarNavItem } from "@/lib/types"
import { Card } from "@/components/shared/card"
import { DashboardShellSkeleton } from "@/components/shared/dashboard/shell-loading"
import { DashboardSideBarNav } from "@/components/shared/dashboard/sidebar-nav"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DashboardShell({
  children,
  items,
  prefixPath,
  isLoading,
}: {
  items?: SidebarNavItem[]
  children?: ReactNode
  prefixPath?: string
  isLoading?: boolean
}) {
  return (
    <ScrollArea className="h-screen w-full">
      <MaxWidthWrapper className="max-w-screen-2xl pt-10">
        {isLoading ? (
          <DashboardShellSkeleton />
        ) : items ? (
          <div className="grid gap-5 md:grid-cols-[200px_1fr]">
            <aside className="min-w-full flex-col md:flex md:w-[200px]">
              <DashboardSideBarNav path={prefixPath} items={items} />
            </aside>
            <Card>
              <main className="flex w-full flex-1 flex-col overflow-hidden">
                {children}
              </main>
            </Card>
          </div>
        ) : (
          <Card>
            <main className="flex w-full flex-1 flex-col overflow-hidden">
              {children}
            </main>
          </Card>
        )}
      </MaxWidthWrapper>
    </ScrollArea>
  )
}
