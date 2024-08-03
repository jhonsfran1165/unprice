import { CURRENCIES, STATUS_PLAN } from "@unprice/db/utils"
import { Button } from "@unprice/ui/button"
import { Separator } from "@unprice/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@unprice/ui/tabs"
import { Typography } from "@unprice/ui/typography"
import { Plus } from "lucide-react"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import { PlanActions } from "../../_components/plan-actions"
import { PlanVersionDialog } from "../_components/plan-version-dialog"
import { columns } from "../_components/table/columns"

export default async function PlanPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
}) {
  const { planSlug } = params

  const { plan } = await api.plans.getBySlug({
    slug: planSlug,
  })

  if (!plan) {
    notFound()
  }

  return (
    <DashboardShell
      header={
        <HeaderTab
          title={plan.slug}
          description={plan.description}
          label={plan.active ? "active" : "inactive"}
          action={
            <div className="button-primary flex items-center space-x-1 rounded-md">
              <div className="sm:col-span-full">
                <PlanVersionDialog
                  defaultValues={{
                    planId: plan.id,
                    description: plan.description,
                    title: plan.slug,
                    projectId: plan.projectId,
                    // TODO: use default currency from org settings
                    currency: "USD",
                    planType: "recurring",
                    paymentProvider: "stripe",
                  }}
                >
                  <Button variant={"custom"}>
                    <Plus className="mr-2 h-4 w-4" /> Version
                  </Button>
                </PlanVersionDialog>
              </div>

              <Separator orientation="vertical" className="h-[20px] p-0" />

              <PlanActions plan={plan} />
            </div>
          }
        />
      }
    >
      <Tabs defaultValue="versions">
        <div className="flex items-center">
          <TabsList variant="line">
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="versions" className="mt-4">
          <div className="flex flex-col px-1 py-4">
            <Typography variant="p" affects="removePaddingMargin">
              All versions of this plan
            </Typography>
          </div>
          <Suspense
            fallback={
              <DataTableSkeleton
                columnCount={7}
                searchableColumnCount={1}
                filterableColumnCount={2}
                cellWidths={["10rem", "40rem", "12rem", "12rem", "12rem", "12rem", "8rem"]}
                shrinkZero
              />
            }
          >
            <DataTable
              columns={columns}
              data={plan.versions}
              filterOptions={{
                filterBy: "title",
                filterColumns: false,
                filterDateRange: false,
                filterServerSide: false,
                filterSelectors: {
                  status: STATUS_PLAN.map((value) => ({
                    value: value,
                    label: value,
                  })),
                  currency: CURRENCIES.map((value) => ({
                    value: value,
                    label: value,
                  })),
                },
              }}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="customers" className="mt-4">
          dasd
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          dsd
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
