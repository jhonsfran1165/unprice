import { analytics } from "@unprice/analytics/client"
import { Users } from "lucide-react"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { filtersDataTableCache } from "~/lib/searchParams"
import Stats from "../_components/stats"
import TabsDashboard from "../_components/tabs-dashboard"
import { columns } from "./_components/table/columns"

export const dynamic = "force-dynamic"

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`

  const filter = filtersDataTableCache.parse(props.searchParams)

  const plansConversion = await analytics.getPlansConversion({
    start_date: filter.from ? new Date(filter.from).toISOString() : undefined,
    end_date: filter.to ? new Date(filter.to).toISOString() : undefined,
    limit: filter.page_size,
    offset: filter.page * filter.page_size,
  })

  return (
    <DashboardShell>
      <TabsDashboard baseUrl={baseUrl} activeTab="plans" />
      <Stats
        stats={[
          {
            total: plansConversion.data.length,
            icon: <Users />,
            title: "Total Plans",
            description: "Total number of plans",
          },
        ]}
      />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            showDateFilterOptions={true}
            showViewOptions={true}
            searchableColumnCount={1}
            cellWidths={["10rem", "30rem", "20rem", "20rem", "20rem", "20rem", "12rem", "8rem"]}
            shrinkZero
          />
        }
      >
        <DataTable
          columns={columns}
          data={plansConversion.data}
          filterOptions={{
            filterBy: "plan_version_id",
            filterColumns: true,
            filterDateRange: true,
            filterServerSide: false,
          }}
        />
      </Suspense>
    </DashboardShell>
  )
}
