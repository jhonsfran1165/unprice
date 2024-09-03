import { CURRENCIES, STATUS_PLAN } from "@unprice/db/utils"
import { Button } from "@unprice/ui/button"
import { Separator } from "@unprice/ui/separator"
import { TabNavigation, TabNavigationLink } from "@unprice/ui/tabs-navigation"
import { Typography } from "@unprice/ui/typography"
import { Plus } from "lucide-react"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { SuperLink } from "~/components/super-link"
import { api } from "~/trpc/server"
import { PlanActions } from "../../_components/plan-actions"
import { PlanVersionDialog } from "../_components/plan-version-dialog"
import { columns } from "../_components/table-versions/columns"

export default async function PlanPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
  }
}) {
  const { planSlug, workspaceSlug, projectSlug } = params
  const baseUrl = `/${workspaceSlug}/${projectSlug}/plans/${planSlug}`

  const { plan, project } = await api.plans.getVersionsBySlug({
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
          id={plan.id}
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
                    currency: project.defaultCurrency,
                    planType: "recurring",
                    paymentProvider: "stripe",
                    startCycle: "1",
                    billingPeriod: "month",
                    collectionMethod: "charge_automatically",
                    whenToBill: "pay_in_arrear",
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
      <TabNavigation>
        <div className="flex items-center">
          <TabNavigationLink active asChild>
            <SuperLink href={`${baseUrl}`}>Versions</SuperLink>
          </TabNavigationLink>
          <TabNavigationLink asChild>
            <SuperLink href={`${baseUrl}/subscriptions`}>Subscriptions</SuperLink>
          </TabNavigationLink>
        </div>
      </TabNavigation>
      <div className="mt-4">
        <div className="flex flex-col px-1 py-4">
          <Typography variant="p" affects="removePaddingMargin">
            All versions of this plan
          </Typography>
        </div>
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={12}
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
                "12rem",
                "8rem",
              ]}
              shrinkZero
            />
          }
        >
          <DataTable
            columns={columns}
            data={plan.versions}
            filterOptions={{
              filterBy: "title",
              filterColumns: true,
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
      </div>
    </DashboardShell>
  )
}
