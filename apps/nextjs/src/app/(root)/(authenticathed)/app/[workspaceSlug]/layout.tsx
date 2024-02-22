import { Suspense } from "react"
import dynamic from "next/dynamic"

import { Button } from "@builderai/ui/button"
import { Skeleton } from "@builderai/ui/skeleton"

import Header from "~/components/header"
import { Logo } from "~/components/logo"
import { MainNav } from "~/components/main-nav"
import { ProjectSwitcher } from "~/components/project-switcher"
import { ProjectSwitcherSkeleton } from "~/components/project-switcher-skeleton"
import { WorkspaceSwitcher } from "~/components/workspace-switcher"
import { WorkspaceSwitcherSkeleton } from "~/components/workspace-switcher-skeleton"
import { api } from "~/trpc/server"

const ThemeToggle = dynamic(() => import("~/components/theme-toggle"), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="sm" className="button-ghost">
      <Skeleton className="h-5 w-5 rounded-full" />
    </Button>
  ),
})
export default function DashboardLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header>
        <div className="flex h-14 items-center space-x-2 sm:justify-between sm:space-x-0">
          <div className="flex items-center justify-start">
            <Logo />
            <span className="ml-6 mr-4 text-lg font-bold text-muted-foreground">
              /
            </span>
            <Suspense fallback={<WorkspaceSwitcherSkeleton />}>
              <WorkspaceSwitcher
                workspaceSlug={props.params.workspaceSlug}
                workspacesPromise={api.workspaces.listWorkspaces()}
              />
            </Suspense>
            <Suspense fallback={<ProjectSwitcherSkeleton />}>
              <ProjectSwitcher
                projectPromise={api.projects.listByActiveWorkspace()}
              />
            </Suspense>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4 px-4">
            <MainNav />
          </div>
          <ThemeToggle />
        </div>
      </Header>
      <div className="flex flex-1 overflow-hidden">{props.children}</div>
    </div>
  )
}
