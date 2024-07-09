import type React from "react"

import { notFound } from "next/navigation"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import Stepper from "./_components/stepper"
import StepperButton from "./_components/stepper-button"
import VersionOverview from "./_components/version-overview"

export default async function PlanVersionLayout(props: {
  children: React.ReactNode
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
}) {
  const { planVersion } = await api.planVersions.getById({
    id: props.params.planVersionId,
  })

  if (!planVersion) {
    notFound()
  }

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Plan Version Settings"
          description="Configure features, addons and pricing for this plan version."
          action={
            <StepperButton
              planVersionId={props.params.planVersionId}
              baseUrl={`/${props.params.workspaceSlug}/${props.params.projectSlug}/plans/${props.params.planSlug}/${props.params.planVersionId}`}
            />
          }
        />
      }
    >
      <Stepper
        planVersionId={props.params.planVersionId}
        className="flex flex-col py-4"
        baseUrl={`/${props.params.workspaceSlug}/${props.params.projectSlug}/plans/${props.params.planSlug}/${props.params.planVersionId}`}
      />
      <div className="flex flex-col items-start gap-8 lg:flex-row sm:py-0">
        <div className="flex w-full flex-col justify-center lg:w-3/4">{props.children}</div>
        <div className="flex w-full flex-col lg:w-1/4">
          <VersionOverview planVersion={planVersion} />
        </div>
      </div>
    </DashboardShell>
  )
}
