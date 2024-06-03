import { notFound } from "next/navigation"
import { ArrowUp, ListFilter, MoreVertical } from "lucide-react"

import { APP_DOMAIN } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@builderai/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import CustomerHeader from "../_components/customer-header"
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

  const { providers } = await api.customers.listPaymentProviders({
    customerId: customer.id,
  })

  if (!customer) {
    notFound()
  }

  return (
    <div className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <CustomerHeader
          workspaceSlug={workspaceSlug}
          projectSlug={projectSlug}
          customer={customer}
        />
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-sm"
                  >
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked>
                    Currency
                  </DropdownMenuCheckboxItem>
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
                      <TableHead className="table-cell text-left">
                        Plan Version
                      </TableHead>
                      <TableHead className="table-cell text-center">
                        Currency
                      </TableHead>
                      <TableHead className="hidden text-center sm:table-cell">
                        Type
                      </TableHead>
                      <TableHead className="table-cell text-center">
                        Status
                      </TableHead>
                      <TableHead className="table-cell text-center">
                        Start Date
                      </TableHead>
                      <TableHead className="table-cell text-center">
                        End Date
                      </TableHead>
                      <TableHead className="table-cell text-left">
                        Actions
                      </TableHead>
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
                            {sub.planVersion.plan.slug} - v
                            {sub.planVersion.version}
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
                          <span className="text-xs">
                            {formatDate(sub.startDate)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-center md:table-cell">
                          <span className="text-xs">
                            {(sub.endDate && formatDate(sub.endDate)) ??
                              "Forever"}
                          </span>
                        </TableCell>
                        <TableCell className="table-cell justify-start">
                          <div className="flex flex-row space-x-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  Edit Subscription
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Downgrade/Upgrade
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  End Subscription
                                </DropdownMenuItem>
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
          <TabsContent value="paymentMethods"></TabsContent>
        </Tabs>
      </div>
      <div className="flex flex-col gap-4">
        <PaymentMethodForm
          paymentProviders={providers}
          customer={customer}
          successUrl={`${APP_DOMAIN}/${workspaceSlug}/${projectSlug}/customers/${customerId}`}
          cancelUrl={`${APP_DOMAIN}/${workspaceSlug}/${projectSlug}/customers/${customerId}`}
        />
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start">
            <div className="grid gap-0.5">
              <CardTitle className="group flex items-center gap-2 text-lg">
                STATISTICS
              </CardTitle>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-6 text-sm">
            <div className="grid gap-3">
              <div className="font-semibold">Revenue</div>
              <dl className="grid gap-3">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Total revenue</dt>
                  <dd>$ 10.456</dd>
                </div>
              </dl>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Subscriptions Details</div>
              <ul className="grid gap-3 font-light">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Active Subscriptions
                  </span>
                  <span>49</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Inactive Subscriptions
                  </span>
                  <span>11</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Churn Subscriptions
                  </span>
                  <span className="flex flex-row">
                    +3.5% <ArrowUp className="ml-2 h-4 w-4" />
                  </span>
                </li>
              </ul>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Versions</div>
              <dl className="grid gap-3">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Best version</dt>
                  <dd>version 1</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Worse version</dt>
                  <dd>version 2</dd>
                </div>
              </dl>
            </div>
          </CardContent>
          <CardFooter className="flex flex-row items-center border-t px-6 py-3">
            <div className="text-muted-foreground text-xs">
              Updated{" "}
              <time dateTime="2023-11-23">10:45am, November 23, 2023</time>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
