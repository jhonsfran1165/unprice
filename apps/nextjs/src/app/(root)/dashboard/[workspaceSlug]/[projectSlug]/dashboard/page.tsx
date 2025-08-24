import { prepareInterval } from "@unprice/analytics"
import type { SearchParams } from "nuqs/server"
import { AnalyticsCard } from "~/components/analytics/analytics-card"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { UsageChart } from "~/components/analytics/usage-chart"
import { VerificationsChart } from "~/components/analytics/verifications-chart"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { intervalParams } from "~/lib/searchParams"
import { LatencyTable } from "./_components/latency-table"
import OverviewStats from "./_components/overview-stats"
import TabsDashboard from "./_components/tabs-dashboard"

export default async function DashboardOverview(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const filter = intervalParams(props.searchParams)
  const interval = prepareInterval(filter.intervalFilter)

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <TabsDashboard baseUrl={baseUrl} activeTab="overview" />
        <IntervalFilter className="ml-auto" />
      </div>

      <OverviewStats />
      <AnalyticsCard
        className="w-full"
        title="Feature Verifications & Usage"
        description="Feature verifications and usage recorded for the selected interval."
        defaultTab="verifications"
        tabs={[
          {
            id: "verifications",
            label: "Verifications",
            description: `Feature verifications for the ${interval.label}.`,
            chart: () => <VerificationsChart />,
          },
          {
            id: "usage",
            label: "Usage",
            description: `Feature usage for the ${interval.label}.`,
            chart: () => <UsageChart />,
          },
        ]}
      />
      <LatencyTable />
    </DashboardShell>
  )
}
