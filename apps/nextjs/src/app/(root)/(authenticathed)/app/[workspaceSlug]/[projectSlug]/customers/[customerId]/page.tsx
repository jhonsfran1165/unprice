import { ListFilter, MoreVertical } from "lucide-react"
import { notFound } from "next/navigation"

import { APP_DOMAIN } from "@builderai/config"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@builderai/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { Separator } from "@builderai/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@builderai/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"
import { cn } from "@builderai/ui/utils"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import { SubscriptionSheet } from "../../subscriptions/_components/subscription-sheet"
import { CustomerActions } from "../_components/customer-actions"
import { PaymentMethodForm } from "../_components/payment-method-form"

export default async function PlanPage({
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
    id: customerId,
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
          action={
            <div className="button-primary flex items-center space-x-1 rounded-md">
              <div className="sm:col-span-full">
                <SubscriptionSheet
                  defaultValues={{
                    customerId: customer.id,
                    projectId: customer.projectId,
                    planVersionId: "",
                    type: "plan",
                    collectionMethod: "charge_automatically",
                    autoRenew: true,
                    config: [],
                    defaultPaymentMethodId: "",
                    startDate: new Date(),
                  }}
                >
                  <Button variant={"custom"}>Add Subscription</Button>
                </SubscriptionSheet>
              </div>

              <Separator orientation="vertical" className="h-[20px] p-0" />

              <CustomerActions customer={customer} />
            </div>
          }
        />
      }
    >
      <Tabs defaultValue="subscriptions">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="paymentMethods">Payment Methods</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>Currency</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Active</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader className="px-7">
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>All subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="table-cell text-left">Plan Version</TableHead>
                    <TableHead className="table-cell text-center">Currency</TableHead>
                    <TableHead className="hidden text-center sm:table-cell">Type</TableHead>
                    <TableHead className="table-cell text-center">Status</TableHead>
                    <TableHead className="table-cell text-center">Start Date</TableHead>
                    <TableHead className="table-cell text-center">End Date</TableHead>
                    <TableHead className="table-cell text-left">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.subscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  )}
                  {customer.subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="table-cell">
                        <div className="font-bold">
                          {sub.planVersion.plan.slug} - v{sub.planVersion.version}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell text-center">
                        <Badge className="text-xs" variant="secondary">
                          {sub.planVersion.currency}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-center md:table-cell">
                        <Badge className="text-xs">{sub.type}</Badge>
                      </TableCell>
                      <TableCell className="table-cell text-center">
                        <Badge
                          className={cn({
                            success: sub.status === "active",
                          })}
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-center md:table-cell">
                        <span className="text-xs">{formatDate(sub.startDate)}</span>
                      </TableCell>
                      <TableCell className="hidden text-center md:table-cell">
                        <span className="text-xs">
                          {(sub.endDate && formatDate(sub.endDate)) ?? "Forever"}
                        </span>
                      </TableCell>
                      <TableCell className="table-cell justify-start">
                        <div className="flex flex-row space-x-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Edit Subscription</DropdownMenuItem>
                              <DropdownMenuItem>Downgrade/Upgrade</DropdownMenuItem>
                              <DropdownMenuItem>End Subscription</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="paymentMethods">
          <PaymentMethodForm
            customer={customer}
            successUrl={`${APP_DOMAIN}/${workspaceSlug}/${projectSlug}/customers/${customerId}`}
            cancelUrl={`${APP_DOMAIN}/${workspaceSlug}/${projectSlug}/customers/${customerId}`}
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
