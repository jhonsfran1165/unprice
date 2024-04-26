import React from "react"
import { Provider } from "jotai"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import { api } from "~/trpc/server"
import PlanVersionHeader from "../../_components/plan-version-header"
import { NavVersionPlan } from "../../_components/plan-version-nav"

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
  const { planVersion } = await api.plans.getVersionById({
    versionId: Number(planVersionId),
    planSlug,
  })

  return (
    <Provider>
      <DashboardShell
        header={
          <PlanVersionHeader
            workspaceSlug={workspaceSlug}
            projectSlug={projectSlug}
            planVersionId={planVersionId}
            planVersion={planVersion}
          />
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
