import type { SearchParams } from "nuqs/server"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import TabsDashboard from "../_components/tabs-dashboard"
import { ChartLineInteractive } from "./_components/visits"

export default async function DashboardPages(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <TabsDashboard baseUrl={baseUrl} activeTab="pages" />
        <IntervalFilter className="ml-auto" />
      </div>
      <ChartLineInteractive />
    </DashboardShell>
  )
}
