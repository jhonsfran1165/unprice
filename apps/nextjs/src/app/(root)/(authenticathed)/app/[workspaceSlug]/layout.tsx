import { Suspense } from "react"

import Header from "~/components/layout/header"
import { api } from "~/trpc/server"
import { ProjectSwitcher } from "../_components/project-switcher"
import { ProjectSwitcherSkeleton } from "../_components/project-switcher-skeleton"
import { UpdateClientCookie } from "../_components/update-client-cookie"
import { WorkspaceSwitcher } from "../_components/workspace-switcher"
import { WorkspaceSwitcherSkeleton } from "../_components/workspace-switcher-skeleton"

export const runtime = "edge"

export default function DashboardLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <UpdateClientCookie />
      <Header>
        <>
          {props.params.workspaceSlug && (
            <Suspense fallback={<WorkspaceSwitcherSkeleton />}>
              <WorkspaceSwitcher
                workspaceSlug={props.params.workspaceSlug}
                workspacesPromise={api.workspaces.listWorkspaces()}
              />
            </Suspense>
          )}

          <Suspense fallback={<ProjectSwitcherSkeleton />}>
            <ProjectSwitcher
              projectPromise={api.projects.listByActiveWorkspace()}
            />
          </Suspense>
        </>
      </Header>
      <div className="flex flex-1 overflow-hidden">{props.children}</div>
    </div>
  )
}
