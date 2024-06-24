import { isSlug } from "@builderai/db/utils"
import { Separator } from "@builderai/ui/separator"
import { Fragment, Suspense } from "react"
import Header from "~/components/layout/header"
import { api } from "~/trpc/server"
import { ProjectSwitcher } from "../../_components/project-switcher"
import { ProjectSwitcherSkeleton } from "../../_components/project-switcher-skeleton"
import { UpdateClientCookie } from "../../_components/update-client-cookie"
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
  const { all } = props.params
  const { workspaceSlug, projectSlug } = props.searchParams

  // delete first segment because it's always "/app" for the redirection from the middleware
  all.shift()
  let workspace = null
  let project = null

  if (isSlug(workspaceSlug) || isSlug(all.at(0))) {
    workspace = `${workspaceSlug ?? all.at(0)}`
  }

  if (isSlug(projectSlug) || isSlug(all.at(1))) {
    project = `${projectSlug ?? all.at(1)}`
  }

  console.log("workspace", workspace, project)

  return (
    <Header>
      <UpdateClientCookie workspaceSlug={workspace} projectSlug={project} />
      <Fragment>
        {workspace && (
          <Suspense fallback={<WorkspaceSwitcherSkeleton />}>
            <WorkspaceSwitcher
              workspaceSlug={workspace}
              workspacesPromise={api.workspaces.listWorkspaces()}
            />
          </Suspense>
        )}

        {project && (
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
