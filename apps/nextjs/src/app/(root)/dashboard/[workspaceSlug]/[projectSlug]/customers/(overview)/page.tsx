import { Button } from "@unprice/ui/button"
import { TabNavigation, TabNavigationLink } from "@unprice/ui/tabs-navigation"
import { Typography } from "@unprice/ui/typography"
import { Plus } from "lucide-react"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { columns } from "~/app/(root)/dashboard/[workspaceSlug]/[projectSlug]/customers/_components/customers/table/columns"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { SuperLink } from "~/components/super-link"
import { filtersDataTableCache } from "~/lib/searchParams"
import { api } from "~/trpc/server"
import { CustomerDialog } from "../_components/customers/customer-dialog"

export default async function ProjectUsersPage(props: {
  params: { workspaceSlug: string; projectSlug: string; customerId: string }
  searchParams: SearchParams
}) {
  const { workspaceSlug, projectSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}/customers`
  const filters = filtersDataTableCache.parse(props.searchParams)
  const { customers, pageCount } = await api.customers.listByActiveProject(filters)

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Customers"
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
      <TabNavigation>
        <div className="flex items-center">
          <TabNavigationLink active asChild>
            <SuperLink href={`${baseUrl}`}>Customers</SuperLink>
          </TabNavigationLink>
          <TabNavigationLink asChild>
            <SuperLink href={`${baseUrl}/subscriptions`}>Subscriptions</SuperLink>
          </TabNavigationLink>
        </div>
      </TabNavigation>
      <div className="mt-4">
        <div className="flex flex-col px-1 py-4">
          <Typography variant="p" affects="removePaddingMargin">
            All customers from this app
          </Typography>
        </div>

        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={5}
              searchableColumnCount={1}
              filterableColumnCount={2}
              cellWidths={["10rem", "40rem", "40rem", "12rem", "8rem"]}
              shrinkZero
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
        </Suspense>
      </div>
    </DashboardShell>
  )
}
