import React from "react"
import { Provider } from "jotai"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import PlanVersionActions from "../../_components/plan-version-actions"

export const runtime = "edge"

export default function PriceLayout(props: {
  children: React.ReactNode
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
}) {
  return (
    <Provider>
      <DashboardShell
        backLink={`/${props.params.workspaceSlug}/${props.params.projectSlug}/plans/${props.params.planSlug}`}
        header={
          <HeaderTab
            title="Plan Version Settings"
            description="Manage different settings for this plan version."
            action={
              <PlanVersionActions planVersionId={props.params.planVersionId} />
            }
          />
        }
      >
        {props.children}
      </DashboardShell>
    </Provider>
  )
}
