import { prepareInterval } from "@unprice/tinybird"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { Activity, CreditCard, DollarSign, Users } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"
import { cookies } from "next/headers"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { AnalyticsCard } from "~/components/analytics/analytics-card"
import { UsageChart } from "~/components/analytics/usage-chart"
import { VerificationsChart } from "~/components/analytics/verifications-chart"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { env } from "~/env"
import { intervalParserCache } from "~/lib/searchParams"
import { HydrateClient, api, trpc } from "~/trpc/server"
import { LoadingCard } from "../_components/loading-card"
import { Events } from "./_components/events"

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
            <div className="font-bold text-2xl">$0</div>
            <p className="text-muted-foreground text-xs">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+0</div>
            <p className="text-muted-foreground text-xs">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+0</div>
            <p className="text-muted-foreground text-xs">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Customers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+0</div>
            <p className="text-muted-foreground text-xs">+0 since last hour</p>
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

// #region RecentEvents
async function RecentEvents(props: {
  projectSlug: string
  workspaceSlug: string
  className?: string
}) {
  const { project } = await api.projects.getBySlug({
    slug: props.projectSlug,
  })

  if (!project) {
    return null
  }

  const cookie = cookies()
  const sessionToken =
    env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token"
  const sessionTokenValue = cookie.get(sessionToken)?.value

  return (
    <Card className={cn("flex flex-col", props.className)}>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Realtime events from your project.</CardDescription>
      </CardHeader>
      <CardContent>
        <Events
          sessionToken={sessionTokenValue ?? ""}
          projectId={project.id}
          workspaceSlug={props.workspaceSlug}
          projectSlug={props.projectSlug}
        />
      </CardContent>
    </Card>
  )
}
