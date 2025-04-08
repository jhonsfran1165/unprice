import { Balancer } from "react-wrap-balancer"

import { Button } from "@unprice/ui/button"
import { Typography } from "@unprice/ui/typography"
import { Plus } from "lucide-react"
import { Fragment } from "react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import UpgradePlanError from "~/components/layout/error"
import HeaderTab from "~/components/layout/header-tab"
import { SuperLink } from "~/components/super-link"
import { entitlementFlag } from "~/lib/flags"
import { api } from "~/trpc/server"
import { ProjectCard, ProjectCardSkeleton } from "../_components/project-card"
export default async function WorkspaceOverviewPage(props: {
  params: { workspaceSlug: string }
}) {
  const isProjectsEnabled = await entitlementFlag("projects")

  if (!isProjectsEnabled) {
    return <UpgradePlanError />
  }

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
                <Plus className="mr-2 h-4 w-4" />
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
            <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 w-full text-center">
              <Balancer>
                <Typography variant="h2">This workspace has no projects yet</Typography>
                <Typography variant="large">Create your first project to get started</Typography>
              </Balancer>
            </div>
          </div>
        )}
      </Fragment>
    </DashboardShell>
  )
}
