import type React from "react"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
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
  return (
    <DashboardShell
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
    >
      {props.children}
    </DashboardShell>
  )
}
