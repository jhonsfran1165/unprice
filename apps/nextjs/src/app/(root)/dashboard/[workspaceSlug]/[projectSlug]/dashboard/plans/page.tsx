import { analytics } from "@unprice/analytics/client"
import { TabNavigationLink } from "@unprice/ui/tabs-navigation"
import { TabNavigation } from "@unprice/ui/tabs-navigation"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { SuperLink } from "~/components/super-link"
import { filtersDataTableCache } from "~/lib/searchParams"
import Stats from "../_components/stats"
import { columns } from "../_components/table/columns"

export const dynamic = "force-dynamic"

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`

  const filter = filtersDataTableCache.parse(props.searchParams)

  const plansConversion = await analytics.getPlansConversion({
    start_date: filter.from ? new Date(filter.from).toISOString().split("T")[0] : undefined,
    end_date: filter.to ? new Date(filter.to).toISOString().split("T")[0] : undefined,
  })

  return (
    <DashboardShell>
      <TabNavigation variant="solid">
        <div className="flex items-center">
          <TabNavigationLink asChild>
            <SuperLink href={`${baseUrl}/dashboard`}>Overview</SuperLink>
          </TabNavigationLink>
          <TabNavigationLink active asChild>
            <SuperLink href={`${baseUrl}/dashboard/plans`}>Plans & Features</SuperLink>
          </TabNavigationLink>
          <TabNavigationLink asChild>
            <SuperLink href={`${baseUrl}/dashboard/pages`}>Pages</SuperLink>
          </TabNavigationLink>
        </div>
      </TabNavigation>

      <Stats
        stats={{
          totalRevenue: "0",
          newSignups: 0,
          newSubscriptions: 0,
          newCustomers: 0,
        }}
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
          pageCount={plansConversion.data.length}
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
