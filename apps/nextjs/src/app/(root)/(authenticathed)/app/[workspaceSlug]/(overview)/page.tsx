import { Balancer } from "react-wrap-balancer"

import { Button } from "@builderai/ui/button"
import { Plus } from "lucide-react"
import { Fragment } from "react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { SuperLink } from "~/components/super-link"
import { api } from "~/trpc/server"
import { ProjectCard, ProjectCardSkeleton } from "../_components/project-card"

export default async function WorkspaceOverviewPage(props: {
  params: { workspaceSlug: string }
}) {
  const { projects } = await api.projects.listByWorkspace({
    workspaceSlug: props.params.workspaceSlug,
  })

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Apps"
          description="All your for this Workspace"
          action={
            <SuperLink href={`/${props.params.workspaceSlug}/onboarding`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create App
              </Button>
            </SuperLink>
          }
        />
      }
    >
      <Fragment>
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} workspaceSlug={props.params.workspaceSlug} />
            </li>
          ))}
        </ul>

        {projects.length === 0 && (
          <div className="relative">
            <ul className="grid select-none grid-cols-1 gap-4 opacity-40 lg:grid-cols-3">
              <ProjectCardSkeleton pulse={false} />
              <ProjectCardSkeleton pulse={false} />
              <ProjectCardSkeleton pulse={false} />
            </ul>
            <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center">
              <Balancer>
                <h2 className="text-2xl font-bold">This workspace has no projects yet</h2>
                <p className="text-muted-foreground text-lg">
                  Create your first project to get started
                </p>
              </Balancer>
            </div>
          </div>
        )}
      </Fragment>
    </DashboardShell>
  )
}
