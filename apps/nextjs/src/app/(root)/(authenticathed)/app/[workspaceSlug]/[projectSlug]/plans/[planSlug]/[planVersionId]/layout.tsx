import type React from "react"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import TabsNav from "~/components/layout/tabs-nav"
import { PROJECT_TABS_CONFIG } from "~/constants/projects"
import StepperButton from "./_components/stepper-button"

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
  const { workspaceSlug, projectSlug } = props.params
  const tabs = Object.values(PROJECT_TABS_CONFIG)

  return (
    <DashboardShell
      backLink={`/${props.params.workspaceSlug}/${props.params.projectSlug}/plans/${props.params.planSlug}`}
      header={
        <HeaderTab
          title="Plan Version Settings"
          description="Manage different settings for this plan version."
          action={
            <StepperButton
              planVersionId={props.params.planVersionId}
              baseUrl={`/${props.params.workspaceSlug}/${props.params.projectSlug}/plans/${props.params.planSlug}/${props.params.planVersionId}`}
            />
          }
        />
      }
      tabs={
        <TabsNav
          tabs={tabs}
          activeTab={PROJECT_TABS_CONFIG.plans}
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
