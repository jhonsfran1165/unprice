import React from "react"
import { notFound, redirect } from "next/navigation"
import { Provider } from "jotai"

import { Separator } from "@builderai/ui/separator"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import { api } from "~/trpc/server"
import PlanHeader from "../_components/plan-header"
import PlanVersionList from "../_components/plan-versions-list"
import CreateNewVersion from "../../_components/create-new-version"

export const runtime = "edge"

export default async function PriceLayout(props: {
  children: React.ReactNode
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
}) {
  const { projectSlug, workspaceSlug, planSlug, planVersionId } = props.params
  const { plan } = await api.plans.getBySlug({
    slug: planSlug,
  })

  if (!plan) {
    notFound()
  }

  if (planVersionId !== "latest" && isNaN(parseInt(planVersionId))) {
    notFound()
  }

  if (planVersionId === "latest") {
    const latestVersion = plan.versions.find(
      (version) => version.latest === true
    )

    if (!latestVersion) {
      redirect(
        `/${workspaceSlug}/${projectSlug}/plans/${planSlug}/create-version`
      )
    }

    // redirect to the latest version
    redirect(
      `/${workspaceSlug}/${projectSlug}/plans/${planSlug}/${latestVersion?.version}`
    )
  }

  const activeVersion = plan.versions.find(
    (version) => version.version === Number(planVersionId)
  )

  if (!activeVersion) {
    redirect(
      `/${workspaceSlug}/${projectSlug}/plans/${planSlug}/create-version`
    )
  }

  return (
    <Provider>
      <DashboardShell
        header={
          <PlanHeader
            workspaceSlug={workspaceSlug}
            projectSlug={projectSlug}
            planVersionId={planVersionId}
            plan={plan}
          >
            <div className="flex items-center justify-end space-x-6">
              <PlanVersionList
                plan={plan}
                activePlanVersionId={Number(planVersionId)}
                workspaceSlug={workspaceSlug}
                projectSlug={projectSlug}
              />
              <Separator orientation="vertical" className="h-12" />
              <div className="flex items-center justify-end space-x-6">
                <CreateNewVersion
                  plan={plan}
                  projectSlug={projectSlug}
                  workspaceSlug={workspaceSlug}
                  planVersionId={Number(planVersionId)}
                />
              </div>
            </div>
          </PlanHeader>
        }
      >
        <div className="relative">
          <section>
            <div className="overflow-hidden rounded-[0.5rem] border bg-background shadow-md md:shadow-xl">
              {props.children}
            </div>
          </section>
        </div>
      </DashboardShell>
    </Provider>
  )
}
