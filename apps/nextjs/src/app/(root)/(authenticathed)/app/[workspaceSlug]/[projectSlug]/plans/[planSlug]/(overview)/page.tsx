import { MoreVertical } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@builderai/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@builderai/ui/dialog"
import {
  DropdownMenu,
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
import { SuperLink } from "~/components/super-link"
import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import { PlanActions } from "../../_components/plan-actions"
import { PlanVersionDuplicate } from "../../_components/plan-version-actions"
import { PlanVersionDialog } from "../_components/plan-version-dialog"
import { PlanVersionForm } from "../_components/plan-version-form"

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
  const { planSlug, workspaceSlug, projectSlug } = params

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
          label={plan.active ? "Active" : "Inactive"}
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
                  <Button variant={"custom"}>Add Version</Button>
                </PlanVersionDialog>
              </div>

              <Separator orientation="vertical" className="h-[20px] p-0" />

              <PlanActions plan={plan} />
            </div>
          }
        />
      }
    >
      <div className="flex flex-col">
        <Tabs defaultValue="versions">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="versions">Versions</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="versions">
            <Card>
              <CardHeader className="px-7">
                <CardTitle>Plan Versions</CardTitle>
                <CardDescription>All versions of this plan</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-cell text-left">Title</TableHead>
                      <TableHead className="table-cell text-center">Currency</TableHead>
                      <TableHead className="hidden text-center sm:table-cell">Type</TableHead>
                      <TableHead className="table-cell text-center">Status</TableHead>
                      <TableHead className="table-cell text-center">Date</TableHead>
                      <TableHead className="table-cell text-left">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.versions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No versions found
                        </TableCell>
                      </TableRow>
                    )}
                    {plan.versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell className="table-cell">
                          <SuperLink
                            href={`/${workspaceSlug}/${projectSlug}/plans/${planSlug}/${version.id}`}
                            prefetch={false}
                          >
                            <div className="font-bold">
                              {version.title} - v{version.version}
                            </div>
                            {version.description && (
                              <div className="text-muted-foreground hidden text-xs md:inline">
                                {`${version.description.slice(0, 20)}...`}
                              </div>
                            )}
                          </SuperLink>
                        </TableCell>
                        <TableCell className="table-cell text-center">
                          <Badge className="text-xs" variant="secondary">
                            {version.currency}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-center md:table-cell">
                          <Badge className="text-xs">{version.planType}</Badge>
                        </TableCell>
                        <TableCell className="table-cell text-center">
                          <Badge
                            className={cn({
                              success: version.status === "published",
                            })}
                          >
                            {version.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-center md:table-cell">
                          <span className="text-xs">{formatDate(version.updatedAt)}</span>
                        </TableCell>
                        <TableCell className="table-cell justify-start">
                          <div className="flex flex-row space-x-1">
                            <Dialog>
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
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem>Edit version</DropdownMenuItem>
                                  </DialogTrigger>
                                  <DropdownMenuItem asChild>
                                    <PlanVersionDuplicate
                                      classNames="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-background-bgHover"
                                      planVersionId={version.id}
                                    />
                                  </DropdownMenuItem>

                                  <DropdownMenuItem>
                                    <SuperLink
                                      href={`/${workspaceSlug}/${projectSlug}/plans/${planSlug}/${version.id}`}
                                    >
                                      Configure features
                                    </SuperLink>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <DialogContent>
                                <PlanVersionForm defaultValues={version} />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
