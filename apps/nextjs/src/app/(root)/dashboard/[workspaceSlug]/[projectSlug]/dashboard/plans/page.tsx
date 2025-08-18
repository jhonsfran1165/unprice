import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"

import { prepareInterval } from "@unprice/analytics"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { StatsSkeleton } from "~/components/analytics/stats-cards"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { intervalParserCache } from "~/lib/searchParams"
import { HydrateClient, prefetch, trpc } from "~/trpc/server"
import TabsDashboard from "../_components/tabs-dashboard"
import { PlansConversion, PlansConversionSkeleton } from "./_components/plans-convertion"
import PlansStats from "./_components/plans-stats"

export default async function DashboardPlans(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const filter = intervalParserCache.parse(props.searchParams)
  const interval = prepareInterval(filter.intervalFilter)

  // prefetch
  void Promise.all([
    prefetch(
      trpc.analytics.getPlansStats.queryOptions(
        { interval: filter.intervalFilter },
        {
          staleTime: 1000 * 60, // update every minute
        }
      )
    ),
    prefetch(
      trpc.analytics.getPlansConversion.queryOptions(
        {
          intervalDays: interval.intervalDays,
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
        <TabsDashboard baseUrl={baseUrl} activeTab="plans" />
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
          <PlansStats />
        </Suspense>
        <Suspense fallback={<PlansConversionSkeleton />}>
          <PlansConversion />
        </Suspense>
      </HydrateClient>
    </DashboardShell>
  )
}
