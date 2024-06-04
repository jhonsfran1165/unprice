import { ArrowUp, MoreVertical } from "lucide-react"
import { notFound } from "next/navigation"

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

import { SuperLink } from "~/components/super-link"
import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import PlanHeader from "../../_components/plan-header"
import { PlanVersionDuplicate } from "../../_components/plan-version-actions"
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
  const { planSlug, planVersionId, workspaceSlug, projectSlug } = params

  const { plan } = await api.plans.getBySlug({
    slug: planSlug,
  })

  if (!plan) {
    notFound()
  }

  return (
    <div className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <PlanHeader
          workspaceSlug={workspaceSlug}
          projectSlug={projectSlug}
          planVersionId={planVersionId}
          plan={plan}
        />
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
      <div>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start">
            <div className="grid gap-0.5">
              <CardTitle className="group flex items-center gap-2 text-lg">STATISTICS</CardTitle>
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
                  <span className="text-muted-foreground">Active Subscriptions</span>
                  <span>49</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Inactive Subscriptions</span>
                  <span>11</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Churn Subscriptions</span>
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
              Updated <time dateTime="2023-11-23">10:45am, November 23, 2023</time>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
