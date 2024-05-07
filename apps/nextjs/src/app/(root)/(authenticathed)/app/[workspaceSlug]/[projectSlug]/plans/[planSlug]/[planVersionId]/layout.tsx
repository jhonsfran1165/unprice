import React from "react"
import { Provider } from "jotai"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

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

  return (
    <Provider>
      <DashboardShell
        backLink={`/${props.params.workspaceSlug}/${props.params.projectSlug}/plans/${props.params.planSlug}`}
        header={
          <HeaderTab
            title="Plan Version Settings"
            description="Manage different settings for this plan version."
          />
        }
      >
        {props.children}
      </DashboardShell>
    </Provider>
  )
}
