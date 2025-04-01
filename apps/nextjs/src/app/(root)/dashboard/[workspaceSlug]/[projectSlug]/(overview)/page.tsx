import { formatRelative } from "date-fns"

import { prepareInterval } from "@unprice/tinybird"
import type { RouterOutputs } from "@unprice/trpc"
import { Button } from "@unprice/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@unprice/ui/card"
import { Activity, ChevronRight, CreditCard, DollarSign, Users } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { AnalyticsCard } from "~/components/analytics/analytics-card"
import { UsageChart } from "~/components/analytics/usage-chart"
import { VerificationsChart } from "~/components/analytics/verifications-chart"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { SuperLink } from "~/components/super-link"
import { intervalParserCache } from "~/lib/searchParams"
import { HydrateClient, api, trpc } from "~/trpc/server"
import { LoadingCard } from "../_components/loading-card"

// Run this on edge analytics don't query the database
// This is hitting the limits of the free tier in vercel :/
// export const runtime = "edge"

export const dynamic = "force-dynamic"

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const filter = intervalParserCache.parse(props.searchParams)
  const { start, end } = prepareInterval(filter.interval)

  void trpc.analytics.getVerifications.prefetch({
    start,
    end,
  })

  void trpc.analytics.getUsage.prefetch({
    start,
    end,
  })

  return (
    <DashboardShell>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$45,231.89</div>
            <p className="text-muted-foreground text-xs">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+2350</div>
            <p className="text-muted-foreground text-xs">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+12,234</div>
            <p className="text-muted-foreground text-xs">+19% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Customers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+573</div>
            <p className="text-muted-foreground text-xs">+201 since last hour</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <HydrateClient>
          <AnalyticsCard
            className="w-full"
            title="Feature Verifications & Usage"
            description="Feature verifications and usage recorded for this month."
            defaultTab="verifications"
            tabs={[
              {
                id: "verifications",
                label: "Verifications",
                description: "Feature verifications recorded for the selected interval.",
                chart: () => <VerificationsChart />,
              },
              {
                id: "usage",
                label: "Usage",
                description: "Feature usage recorded for the selected interval.",
                chart: () => <UsageChart />,
              },
            ]}
          />
        </HydrateClient>

        <Suspense
          fallback={
            <LoadingCard
              title="Recent Ingestions"
              description="Loading recent ingestions..."
              className="col-span-7 md:col-span-2 lg:col-span-3"
            />
          }
        >
          <RecentEvents
            className="w-full md:w-1/3"
            projectSlug={projectSlug}
            workspaceSlug={workspaceSlug}
          />
        </Suspense>
      </div>
    </DashboardShell>
  )
}

// #region IngestionCard
function IngestionCard(props: {
  projectSlug: string
  workspaceSlug: string
  ingestion: RouterOutputs["ingestions"]["list"][number]
}) {
  const { ingestion } = props
  const { adds, subs } = ingestion

  const N_SQUARES = 5
  const addSquares = Math.round((adds / (adds + subs)) * N_SQUARES)

  const truncatedHash = ingestion.hash.slice(0, 15)

  return (
    <SuperLink href={`/${props.workspaceSlug}/${props.projectSlug}/ingestions/${ingestion.id}`}>
      <div className="flex items-center rounded p-1 hover:bg-muted">
        <div className="space-y-1">
          <p className="font-medium text-sm leading-none">{truncatedHash}</p>
          <p className="text-muted-foreground text-sm">
            {formatRelative(new Date(ingestion.createdAtM), new Date())}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-center text-sm">
          <div>
            +{adds} -{subs}
          </div>
          <div className="flex gap-[2px]">
            {new Array(N_SQUARES).fill(null).map((_, i) => (
              <span
                key={Math.random()}
                className={cn(
                  "inline-block h-2 w-2",
                  i < addSquares ? "bg-green-500" : "bg-red-500",
                  adds + subs === 0 && "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>

        <ChevronRight className="ml-2 h-4 w-4" />
      </div>
    </SuperLink>
  )
}

// #region RecentEvents
async function RecentEvents(props: {
  projectSlug: string
  workspaceSlug: string
  className?: string
}) {
  const ingestions = await api.ingestions.list({
    projectSlug: props.projectSlug,
    limit: 5,
  })

  return (
    <Card className={cn("flex flex-col", props.className)}>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>
          {ingestions.length} event{ingestions.length > 1 ? "s" : null} recorded this period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ingestions.map((ingestion) => (
          <IngestionCard
            key={ingestion.id}
            ingestion={ingestion}
            projectSlug={props.projectSlug}
            workspaceSlug={props.workspaceSlug}
          />
        ))}
      </CardContent>
      <CardFooter>
        <Button size="sm" className="ml-auto">
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
