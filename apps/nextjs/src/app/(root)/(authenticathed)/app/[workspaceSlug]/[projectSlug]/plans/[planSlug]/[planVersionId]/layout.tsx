import React from "react"
import { notFound, redirect } from "next/navigation"
import { Provider } from "jotai"

import { Separator } from "@builderai/ui/separator"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import { api } from "~/trpc/server"
import CreateNewVersion from "../../_components/create-new-version"
import PlanHeader from "../../_components/plan-header"
import { NavVersionPlan } from "../../_components/plan-version-nav"
import PlanVersionList from "../../_components/plan-versions-list"

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
        <NavVersionPlan
          baseUrl={`/${workspaceSlug}/${projectSlug}/plans/${planSlug}/${planVersionId}`}
        />
        <div className="relative">
          <section>{props.children}</section>
        </div>
      </DashboardShell>
    </Provider>
  )
}
