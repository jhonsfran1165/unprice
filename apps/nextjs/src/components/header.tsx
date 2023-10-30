import dynamic from "next/dynamic"

import { Logo } from "~/components/logo"
import { MainNav } from "~/components/main-nav"
import UserNavSkeleton from "~/components/user-nav-skeleton"
import { WorkspaceSwitcherSkeleton } from "~/components/workspace-switcher-skeleton"
import { api } from "~/trpc/server"

const WorkspaceSwitcher = dynamic(
  () => import("~/components/workspace-switcher"),
  { ssr: false, loading: WorkspaceSwitcherSkeleton }
)

const ProjectSwitcher = dynamic(() => import("~/components/project-switcher"), {
  ssr: false,
  loading: WorkspaceSwitcherSkeleton,
})

const UserNav = dynamic(() => import("~/components/user-nav"), {
  ssr: false,
  loading: UserNavSkeleton,
})

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
          <ProjectSwitcher activeProjects={activeProjects} />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <MainNav />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
