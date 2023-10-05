import { Logo } from "~/components/logo"
import { MainNav } from "~/components/main-nav"
import { ProjectSwitcher } from "~/components/project-switcher"
import { UserNav } from "~/components/user-nav"
import { WorkspaceSwitcher } from "~/components/workspace-switcher"
import { api } from "~/trpc/server"

export default function Header() {
  return (
    <header className="top-0 mx-auto w-full px-6">
      <div className="flex h-16 items-center space-x-2 sm:justify-between sm:space-x-0">
        <div className="flex items-center justify-start">
          <Logo />
          <span className="mx-4 text-lg font-bold text-muted-foreground">
            /
          </span>
          <WorkspaceSwitcher />
          <ProjectSwitcher
            projectsPromise={api.project.listByActiveWorkspace.query()}
          />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <MainNav />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
