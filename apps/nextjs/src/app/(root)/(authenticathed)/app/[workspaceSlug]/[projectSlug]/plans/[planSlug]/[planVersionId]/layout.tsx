import React from "react"
import { Provider } from "jotai"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import Stepper from "./(overview)/stepper"

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
  const { planVersion } = await api.planVersions.getByVersion({
    version: Number(planVersionId),
    planSlug,
  })

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
        sidebar={<Stepper />}
      >
        {props.children}
      </DashboardShell>
    </Provider>
  )
}
