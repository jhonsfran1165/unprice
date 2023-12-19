import { Suspense } from "react"
import dynamic from "next/dynamic"

import { Button } from "@builderai/ui/button"
import { Skeleton } from "@builderai/ui/skeleton"

import { Logo } from "~/components/logo"
import { MainNav } from "~/components/main-nav"
import { ProjectSwitcher } from "./project-switcher"
import { ProjectSwitcherSkeleton } from "./project-switcher-skeleton"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { WorkspaceSwitcherSkeleton } from "./workspace-switcher-skeleton"

const ThemeToggle = dynamic(() => import("~/components/theme-toggle"), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="sm" className="button-ghost">
      <Skeleton className="h-6 w-6 rounded-full" />
    </Button>
  ),
})

export default function Header() {
  return (
    <header className="top-0 mx-auto w-full bg-background-bg px-3">
      <div className="flex h-14 items-center space-x-2 sm:justify-between sm:space-x-0">
        <div className="flex items-center justify-start">
          <Logo />
          <span className="ml-6 mr-4 text-lg font-bold text-muted-foreground">
            /
          </span>
          <Suspense fallback={<WorkspaceSwitcherSkeleton />}>
            <WorkspaceSwitcher />
          </Suspense>
          <Suspense fallback={<ProjectSwitcherSkeleton />}>
            <ProjectSwitcher />
          </Suspense>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4 px-4">
          <MainNav />
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
