import React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Badge } from "@builderai/ui/badge"

import { DashboardShell } from "~/components/layout/dashboard-shell"

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
  return (
    <DashboardShell>
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
