import React from "react"
import { notFound } from "next/navigation"
import { Provider } from "jotai"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import { api } from "~/trpc/server"
import PlanHeader from "../_components/plan-header"
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
