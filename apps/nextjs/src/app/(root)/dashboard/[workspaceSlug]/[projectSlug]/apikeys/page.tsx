import type { SearchParams } from "nuqs/server"
import { DataTable } from "~/components/data-table/data-table"
import { DashboardShell } from "~/components/layout/dashboard-shell"
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
  const { apikeys, pageCount } = await api.apikeys.listByActiveProject(filters)

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
    </DashboardShell>
  )
}
