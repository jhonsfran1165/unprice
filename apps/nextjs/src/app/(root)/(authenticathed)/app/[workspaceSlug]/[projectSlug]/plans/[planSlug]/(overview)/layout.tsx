import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import type React from "react"

import { Badge } from "@builderai/ui/badge"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import TabsNav from "~/components/layout/tabs-nav"
import { PROJECT_TABS_CONFIG } from "~/constants/projects"

export const runtime = "edge"

export default function PlanLayout(props: {
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
      tabs={
        <TabsNav
          tabs={tabs}
          activeTab={PROJECT_TABS_CONFIG.plans}
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      <div className="flex flex-col">
        <div className="mb-4 flex justify-between align-middle">
          <Link
            className="flex items-center justify-start align-middle text-sm"
            prefetch={false}
            href={`/${props.params.workspaceSlug}/${props.params.projectSlug}/plans`}
          >
            <Badge variant={"outline"} className="bg-background-bgSubtle py-1">
              <ChevronLeft className="h-4 w-4" />
              back
            </Badge>
          </Link>
        </div>
        <section>{props.children}</section>
      </div>
    </DashboardShell>
  )
}
