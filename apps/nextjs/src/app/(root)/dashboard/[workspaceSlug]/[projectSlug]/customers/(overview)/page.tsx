import { Button } from "@unprice/ui/button"
import { Plus } from "lucide-react"
import type { SearchParams } from "nuqs/server"
import { columns } from "~/app/(root)/dashboard/[workspaceSlug]/[projectSlug]/customers/_components/table/columns"
import { DataTable } from "~/components/data-table/data-table"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { filtersDataTableCache } from "~/lib/searchParams"
import { api } from "~/trpc/server"
import { CustomerDialog } from "../_components/customer-dialog"

export default async function ProjectUsersPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const filters = filtersDataTableCache.parse(props.searchParams)
  const { customers, pageCount } = await api.customers.listByActiveProject(filters)

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
        pageCount={pageCount}
        columns={columns}
        data={customers}
        filterOptions={{
          filterBy: "email",
          filterColumns: true,
          filterDateRange: true,
          filterServerSide: false,
        }}
      />
    </DashboardShell>
  )
}
