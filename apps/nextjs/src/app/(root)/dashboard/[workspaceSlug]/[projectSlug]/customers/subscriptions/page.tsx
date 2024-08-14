import { STATUS_SUBSCRIPTION } from "@unprice/db/utils"
import { Button } from "@unprice/ui/button"
import { TabNavigation, TabNavigationLink } from "@unprice/ui/tabs-navigation"
import { Typography } from "@unprice/ui/typography"
import { Plus } from "lucide-react"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { SuperLink } from "~/components/super-link"
import { filtersDataTableCache } from "~/lib/searchParams"
import { api } from "~/trpc/server"
import { SubscriptionSheet } from "../_components/subscriptions/subscription-sheet"
import { columns } from "../_components/subscriptions/table-subscriptions/columns"

export default async function PlanSubscriptionsPage({
  params,
  searchParams,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    customerId: string
  }
  searchParams: SearchParams
}) {
  const { workspaceSlug, projectSlug } = params
  const baseUrl = `/${workspaceSlug}/${projectSlug}/customers`
  const filters = filtersDataTableCache.parse(searchParams)

  const { subscriptions } = await api.subscriptions.listByActiveProject(filters)

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Subscriptions"
          description="Manage your subscriptions, add new subscriptions, update plans and more."
          action={
            <div className="button-primary flex items-center space-x-1 rounded-md">
              <div className="sm:col-span-full">
                <SubscriptionSheet
                  defaultValues={{
                    customerId: "",
                    projectId: "",
                    planVersionId: "",
                    type: "plan",
                    collectionMethod: "charge_automatically",
                    autoRenew: true,
                    config: [],
                    defaultPaymentMethodId: "",
                    startDate: new Date(),
                  }}
                >
                  <Button variant={"primary"}>
                    <Plus className="mr-2 h-4 w-4" />
                    Subscription
                  </Button>
                </SubscriptionSheet>
              </div>
            </div>
          }
        />
      }
    >
      <TabNavigation>
        <div className="flex items-center">
          <TabNavigationLink asChild>
            <SuperLink href={`${baseUrl}`}>Customers</SuperLink>
          </TabNavigationLink>
          <TabNavigationLink asChild active>
            <SuperLink href={`${baseUrl}/subscriptions`}>Subscriptions</SuperLink>
          </TabNavigationLink>
        </div>
      </TabNavigation>
      <div className="mt-4">
        <div className="flex flex-col px-1 py-4">
          <Typography variant="p" affects="removePaddingMargin">
            All subscriptions of this plan
          </Typography>
        </div>
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={11}
              searchableColumnCount={1}
              filterableColumnCount={2}
              cellWidths={[
                "10rem",
                "40rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "8rem",
              ]}
              shrinkZero
            />
          }
        >
          <DataTable
            columns={columns}
            data={subscriptions}
            filterOptions={{
              filterBy: "planVersion",
              filterColumns: true,
              filterDateRange: true,
              filterServerSide: true,
              filterSelectors: {
                status: STATUS_SUBSCRIPTION.map((value) => ({
                  value: value,
                  label: value,
                })),
                version: subscriptions.map((sub) => ({
                  value: sub.version.id,
                  label: `${sub.version.title} - v${sub.version.version}`,
                })),
              },
            }}
          />
        </Suspense>
      </div>
    </DashboardShell>
  )
}
