import { notFound } from "next/navigation"

import { APP_DOMAIN } from "@unprice/config"
import { INVOICE_STATUS, SUBSCRIPTION_STATUS } from "@unprice/db/utils"
import { Button } from "@unprice/ui/button"
import { Separator } from "@unprice/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@unprice/ui/tabs"
import { Typography } from "@unprice/ui/typography"
import { Code, Plus } from "lucide-react"
import { Suspense } from "react"
import { CodeApiSheet } from "~/components/code-api-sheet"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { PaymentMethodForm } from "~/components/forms/payment-method-form"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import { CustomerActions } from "../_components/customers/customer-actions"
import { SubscriptionSheet } from "../_components/subscriptions/subscription-sheet"
import { columns as invoicesColumns } from "../_components/subscriptions/table-invoices/columns"
import { columns } from "../_components/subscriptions/table-subscriptions/columns"

export default async function CustomerPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    customerId: string
  }
}) {
  const { customerId, workspaceSlug, projectSlug } = params

  const { customer } = await api.customers.getSubscriptions({
    customerId,
  })

  if (!customer) {
    notFound()
  }

  return (
    <DashboardShell
      header={
        <HeaderTab
          title={customer.email}
          description={customer.description}
          label={customer.active ? "active" : "inactive"}
          id={customer.id}
          action={
            <div className="flex items-center gap-2">
              <CodeApiSheet defaultMethod="getEntitlements">
                <Button variant={"ghost"}>
                  <Code className="mr-2 h-4 w-4" />
                  API
                </Button>
              </CodeApiSheet>
              <div className="button-primary flex items-center space-x-1 rounded-md">
                <div className="sm:col-span-full">
                  <SubscriptionSheet
                    defaultValues={{
                      customerId: customer.id,
                      projectId: customer.projectId,
                      timezone: customer.timezone,
                      phases: [],
                    }}
                  >
                    <Button variant={"custom"}>
                      <Plus className="mr-2 h-4 w-4" />
                      Subscription
                    </Button>
                  </SubscriptionSheet>
                </div>

                <Separator orientation="vertical" className="h-[20px] p-0" />

                <CustomerActions customer={customer} />
              </div>
            </div>
          }
        />
      }
    >
      <Tabs defaultValue={"subscriptions"}>
        <div className="flex items-center">
          <TabsList variant="line">
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="paymentMethods">Payment Methods</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="subscriptions" className="mt-4">
          <div className="flex flex-col px-1 py-4">
            <Typography variant="p" affects="removePaddingMargin">
              All subscriptions of this customer
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
              />
            }
          >
            <DataTable
              columns={columns}
              data={customer.subscriptions}
              filterOptions={{
                filterBy: "customer",
                filterColumns: true,
                filterDateRange: true,
                filterServerSide: true,
                filterSelectors: {
                  status: SUBSCRIPTION_STATUS.map((value) => ({
                    value: value,
                    label: value,
                  })),
                },
              }}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="paymentMethods" className="mt-4">
          <div className="flex flex-col px-1 py-4">
            <Typography variant="p" affects="removePaddingMargin">
              All subscriptions of this customer
            </Typography>
          </div>
          <PaymentMethodForm
            customerId={customer.id}
            successUrl={`${APP_DOMAIN}${workspaceSlug}/${projectSlug}/customers/${customerId}`}
            cancelUrl={`${APP_DOMAIN}${workspaceSlug}/${projectSlug}/customers/${customerId}`}
          />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <div className="flex flex-col px-1 py-4">
            <Typography variant="p" affects="removePaddingMargin">
              All invoices of this customer
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
              columns={invoicesColumns}
              data={customer.invoices}
              filterOptions={{
                filterBy: "id",
                filterColumns: true,
                filterDateRange: true,
                filterServerSide: true,
                filterSelectors: {
                  status: INVOICE_STATUS.map((value) => ({
                    value: value,
                    label: value,
                  })),
                },
              }}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
