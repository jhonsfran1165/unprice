import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import UpgradePlanError from "~/components/layout/error"
import HeaderTab from "~/components/layout/header-tab"
import { filtersDataTableCache } from "~/lib/searchParams"
import { api } from "~/trpc/server"
import NewApiKeyDialog from "./_components/new-api-key-dialog"
import { columns } from "./_components/table/columns"

export const dynamic = "force-dynamic"

export default async function ApiKeysPage(props: {
  params: { projectSlug: string; workspaceSlug: string }
  searchParams: SearchParams
}) {
  const filters = filtersDataTableCache.parse(props.searchParams)
  const { apikeys, pageCount, error } = await api.apikeys.listByActiveProject(filters)

  if (!error?.access) {
    return <UpgradePlanError error={error} />
  }

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Api Keys"
          description="All the apis of the system"
          action={<NewApiKeyDialog />}
        />
      }
    >
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={5}
            cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem"]}
            showDateFilterOptions
            showViewOptions
            shrinkZero
          />
        }
      >
        <DataTable
          pageCount={pageCount}
          columns={columns}
          data={apikeys}
          filterOptions={{
            filterBy: "name",
            filterColumns: true,
            filterDateRange: true,
            filterServerSide: false,
          }}
        />
      </Suspense>
    </DashboardShell>
  )
}
