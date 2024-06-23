import { Separator } from "@builderai/ui/separator"
import { Fragment, Suspense } from "react"
import Header from "~/components/layout/header"
import { api } from "~/trpc/server"
import { ProjectSwitcher } from "../../_components/project-switcher"
import { ProjectSwitcherSkeleton } from "../../_components/project-switcher-skeleton"
import { WorkspaceSwitcher } from "../../_components/workspace-switcher"
import { WorkspaceSwitcherSkeleton } from "../../_components/workspace-switcher-skeleton"

export default function Page(props: {
  params: {
    all: string[]
  }
  searchParams: {
    workspaceSlug: string
    projectSlug: string
  }
}) {
  const { workspaceSlug, projectSlug } = props.searchParams

  return (
    <Header>
      <Fragment>
        {workspaceSlug && (
          <Suspense fallback={<WorkspaceSwitcherSkeleton />}>
            <WorkspaceSwitcher
              workspaceSlug={workspaceSlug}
              workspacesPromise={api.workspaces.listWorkspaces()}
            />
          </Suspense>
        )}

        {projectSlug && (
          <Fragment>
            <div className="flex size-4 items-center justify-center px-2">
              <Separator className="rotate-[30deg]" orientation="vertical" />
            </div>
            <Suspense fallback={<ProjectSwitcherSkeleton />}>
              <ProjectSwitcher projectPromise={api.projects.listByActiveWorkspace()} />
            </Suspense>
          </Fragment>
        )}
      </Fragment>
    </Header>
  )
}
