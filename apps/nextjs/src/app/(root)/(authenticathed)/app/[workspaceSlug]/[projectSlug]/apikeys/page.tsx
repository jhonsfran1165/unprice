import { searchDataParamsSchema } from "@builderai/db/validators"

import { DataTable } from "~/components/data-table/data-table"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import NewApiKeyDialog from "./_components/new-api-key-dialog"
import { columns } from "./_components/table/columns"

export default async function ApiKeysPage(props: {
  params: { projectSlug: string; workspaceSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const parsed = searchDataParamsSchema.safeParse(props.searchParams)

  const filter = {
    fromDate: undefined as number | undefined,
    toDate: undefined as number | undefined,
  }

  if (parsed?.success) {
    filter.fromDate = parsed.data.fromDate
    filter.toDate = parsed.data.toDate
  }

  const { apikeys } = await api.apikeys.listByActiveProject(filter)

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
        columns={columns}
        data={apikeys}
        filterOptions={{
          filterBy: "name",
          filterColumns: true,
          filterDateRange: true,
        }}
      />
    </DashboardShell>
  )
}
