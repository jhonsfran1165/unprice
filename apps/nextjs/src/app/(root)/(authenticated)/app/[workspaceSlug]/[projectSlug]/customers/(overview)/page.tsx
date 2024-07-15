import { searchDataParamsSchema } from "@builderai/db/validators"

import { Button } from "@builderai/ui/button"
import { Plus } from "lucide-react"
import { columns } from "~/app/(root)/(authenticated)/app/[workspaceSlug]/[projectSlug]/customers/_components/table/columns"
import { DataTable } from "~/components/data-table/data-table"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import { CustomerDialog } from "../_components/customer-dialog"

export default async function ProjectUsersPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const parsed = searchDataParamsSchema.safeParse(props.searchParams)

  const filter = {
    projectSlug: props.params.projectSlug,
    fromDate: undefined as number | undefined,
    toDate: undefined as number | undefined,
  }

  if (parsed?.success) {
    filter.fromDate = parsed.data.fromDate
    filter.toDate = parsed.data.toDate
  }

  const { customers } = await api.customers.listByActiveProject(filter)

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="All customers from your project"
          description="Manage your customers, add new customers, update plans and more."
          action={
            <CustomerDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Customer
              </Button>
            </CustomerDialog>
          }
        />
      }
    >
      <DataTable
        columns={columns}
        data={customers}
        filterOptions={{
          filterBy: "email",
          filterColumns: true,
          filterDateRange: true,
        }}
      />
    </DashboardShell>
  )
}
