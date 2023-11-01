import { Suspense } from "react"

import { Logo } from "~/components/logo"
import { MainNav } from "~/components/main-nav"
import { ProjectSwitcher } from "~/components/project-switcher"
import { api } from "~/trpc/server"
import UserNav from "./user-nav"
import { WorkspaceSwitcher } from "./workspace-switcher"

export default async function Header() {
  const activeProjects = await api.project.listByActiveWorkspace.query()

  return (
    <header className="top-0 mx-auto w-full bg-background-bg px-6">
      <div className="flex h-16 items-center space-x-2 sm:justify-between sm:space-x-0">
        <div className="flex items-center justify-start">
          <Logo />
          <span className="mx-4 text-lg font-bold text-muted-foreground">
            /
          </span>
          <WorkspaceSwitcher />
          <Suspense>
            <ProjectSwitcher activeProjects={activeProjects} />
          </Suspense>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <MainNav />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
