import { Suspense } from "react"

import { Logo } from "~/components/logo"
import { MainNav } from "~/components/main-nav"
import { api } from "~/trpc/server"
import { ProjectSwitcher } from "./project-switcher"
import { ProjectSwitcherSkeleton } from "./project-switcher-skeleton"
import UserNav from "./user-nav"
import UserNavSkeleton from "./user-nav-skeleton"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { WorkspaceSwitcherSkeleton } from "./workspace-switcher-skeleton"

export default async function Header() {
  return (
    <header className="top-0 mx-auto w-full bg-background-bg px-6">
      <div className="flex h-16 items-center space-x-2 sm:justify-between sm:space-x-0">
        <div className="flex items-center justify-start">
          <Logo />
          <span className="mx-4 text-lg font-bold text-muted-foreground">
            /
          </span>
          <Suspense fallback={<WorkspaceSwitcherSkeleton />}>
            <WorkspaceSwitcher />
          </Suspense>
          <Suspense fallback={<ProjectSwitcherSkeleton />}>
            <ProjectSwitcher
              activeProjects={await api.project.listByActiveWorkspace.query()}
            />
          </Suspense>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <MainNav />
          <Suspense fallback={<UserNavSkeleton />}>
            <UserNav />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
