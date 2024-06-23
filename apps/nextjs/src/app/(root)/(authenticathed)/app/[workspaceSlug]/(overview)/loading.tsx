import Link from "next/link"

import { Button } from "@builderai/ui/button"
import { Add, Plus } from "@builderai/ui/icons"

import { Fragment } from "react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { ProjectCardSkeleton } from "../_components/project-card"


export default function Loading() {
  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Apps"
          description="All your for this Workspace"
          action={
            <Link href={"/onboarding"}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create App
              </Button>
            </Link>
          }
        />
      }
    >
      <Fragment>
        <div className="flex w-full justify-end">
          <Link href={"/"} aria-disabled>
            <Button className="h-8 w-8" size={"icon"}>
              <Add className="h-4 w-4" />
            </Button>
          </Link>
        </div>
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
