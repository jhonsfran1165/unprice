import { prepareInterval } from "@unprice/analytics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { cn } from "@unprice/ui/utils"
import { cookies } from "next/headers"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { AnalyticsCard } from "~/components/analytics/analytics-card"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { StatsSkeleton } from "~/components/analytics/stats-cards"
import { UsageChart } from "~/components/analytics/usage-chart"
import { VerificationsChart } from "~/components/analytics/verifications-chart"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { env } from "~/env"
import { intervalParserCache } from "~/lib/searchParams"
import { HydrateClient, api, prefetch, trpc } from "~/trpc/server"
import { Events, EventsEmptyState } from "./_components/events"
import OverviewStats from "./_components/overview-stats"
import TabsDashboard from "./_components/tabs-dashboard"

export default async function DashboardOverview(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const filter = intervalParserCache.parse(props.searchParams)
  const interval = prepareInterval(filter.intervalFilter)

  void Promise.all([
    // prefetch stats
    prefetch(
      trpc.analytics.getOverviewStats.queryOptions(
        {
          interval: filter.intervalFilter,
        },
        {
          staleTime: 1000 * 60, // update every minute
        }
      )
    ),
    // prefetch verifications
    prefetch(
      trpc.analytics.getVerifications.queryOptions(
        {
          start: interval.start,
          end: interval.end,
        },
        {
          staleTime: 1000 * 60, // update every minute
        }
      )
    ),
    // prefetch usage
    prefetch(
      trpc.analytics.getUsage.queryOptions(
        {
          start: interval.start,
          end: interval.end,
        },
        {
          staleTime: 1000 * 60, // update every minute
        }
      )
    ),
  ])

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <TabsDashboard baseUrl={baseUrl} activeTab="overview" />
        <IntervalFilter className="ml-auto" />
      </div>
      <HydrateClient>
        <Suspense
          fallback={
            <StatsSkeleton
              stats={Object.entries({
                totalRevenue: {
                  title: "Total Revenue",
                },
                newSignups: {
                  title: "New Signups",
                },
                newSubscriptions: {
                  title: "New Subscriptions",
                },
                newCustomers: {
                  title: "New Customers",
                },
              }).map(([key]) => {
                return {
                  title: key,
                }
              })}
            />
          }
        >
          <OverviewStats />
        </Suspense>
        <div className="mt-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          <AnalyticsCard
            className="w-full md:w-2/3"
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

          <Suspense
            fallback={
              <Card className="w-full md:w-1/3">
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                  <CardDescription>Realtime events from your project.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <EventsEmptyState isLoading />
                </CardContent>
              </Card>
            }
          >
            <RecentEvents
              className="w-full md:w-1/3"
              projectSlug={projectSlug}
              workspaceSlug={workspaceSlug}
              intervalDays={interval.intervalDays}
            />
          </Suspense>
        </div>
      </HydrateClient>
    </DashboardShell>
  )
}

// #region RecentEvents
async function RecentEvents(props: {
  projectSlug: string
  workspaceSlug: string
  className?: string
  intervalDays: number
}) {
  const cookie = cookies()
  const sessionToken =
    env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token"
  const sessionTokenValue = cookie.get(sessionToken)?.value

  const { data: events, projectId } = await api.analytics.getLatestEvents({
    interval_days: props.intervalDays,
  })

  return (
    <Card className={cn("flex flex-col", props.className)}>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Realtime events from your project.</CardDescription>
      </CardHeader>
      <CardContent className="px-3">
        <Events
          sessionToken={sessionTokenValue ?? ""}
          projectId={projectId}
          workspaceSlug={props.workspaceSlug}
          projectSlug={props.projectSlug}
          initialEvents={events}
        />
      </CardContent>
    </Card>
  )
}
