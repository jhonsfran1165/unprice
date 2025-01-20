import { Button } from "@unprice/ui/button"
import { Plus } from "@unprice/ui/icons"

import { Fragment } from "react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { SuperLink } from "~/components/super-link"
import { ProjectCardSkeleton } from "../_components/project-card"

export default function Loading() {
  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Apps"
          description="All your for this Workspace"
          action={
            <SuperLink href={"/onboarding"}>
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
        <div className="relative">
          <ul className="grid select-none grid-cols-1 gap-4 opacity-40 lg:grid-cols-3">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </ul>
        </div>
      </Fragment>
    </DashboardShell>
  )
}
