import { prepareInterval } from "@unprice/analytics"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { intervalParserCache } from "~/lib/searchParams"
import { HydrateClient, prefetch, trpc } from "~/trpc/server"
import { ANALYTICS_STALE_TIME } from "~/trpc/shared"
import TabsDashboard from "../_components/tabs-dashboard"
import FeatureUsageHeatmap, {
  FeatureUsageHeatmapContent,
  FeatureUsageHeatmapSkeleton,
} from "./_components/features-heat-map"
import { FeaturesStats, FeaturesStatsSkeleton } from "./_components/features-stats"

export default async function DashboardFeatures(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`

  const filter = intervalParserCache.parse(props.searchParams)
  const interval = prepareInterval(filter.intervalFilter)

  void Promise.all([
    prefetch(
      trpc.analytics.getFeatureHeatmap.queryOptions(
        {
          intervalDays: interval.intervalDays,
        },
        {
          staleTime: ANALYTICS_STALE_TIME,
        }
      )
    ),
    prefetch(
      trpc.analytics.getFeaturesOverview.queryOptions(
        {
          intervalDays: interval.intervalDays,
        },
        {
          staleTime: ANALYTICS_STALE_TIME,
        }
      )
    ),
  ])

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <TabsDashboard baseUrl={baseUrl} activeTab="features" />
        <IntervalFilter className="ml-auto" />
      </div>

      <HydrateClient>
        <Suspense fallback={<FeaturesStatsSkeleton isLoading={true} />}>
          <FeaturesStats />
        </Suspense>
        <Suspense
          fallback={
            <FeatureUsageHeatmap>
              <FeatureUsageHeatmapSkeleton />
            </FeatureUsageHeatmap>
          }
        >
          <FeatureUsageHeatmap>
            <FeatureUsageHeatmapContent />
          </FeatureUsageHeatmap>
        </Suspense>
      </HydrateClient>
    </DashboardShell>
  )
}
