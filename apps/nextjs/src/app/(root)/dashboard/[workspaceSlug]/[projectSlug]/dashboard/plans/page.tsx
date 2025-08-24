import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"

import { prepareInterval } from "@unprice/analytics"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { StatsSkeleton } from "~/components/analytics/stats-cards"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { intervalParams } from "~/lib/searchParams"
import { HydrateClient, batchPrefetch, trpc } from "~/trpc/server"
import { ANALYTICS_STALE_TIME } from "~/trpc/shared"
import TabsDashboard from "../_components/tabs-dashboard"
import { PlansConversion, PlansConversionSkeleton } from "./_components/plans-convertion"
import PlansStats from "./_components/plans-stats"

export const dynamic = "force-dynamic"

export default async function DashboardPlans(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const filter = intervalParams(props.searchParams)
  const interval = prepareInterval(filter.intervalFilter)

  // prefetch
  batchPrefetch([
    trpc.analytics.getPlansStats.queryOptions(
      { interval: filter.intervalFilter },
      {
        staleTime: ANALYTICS_STALE_TIME,
      }
    ),
    trpc.analytics.getPlansConversion.queryOptions(
      {
        intervalDays: interval.intervalDays,
      },
      {
        staleTime: ANALYTICS_STALE_TIME,
      }
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
