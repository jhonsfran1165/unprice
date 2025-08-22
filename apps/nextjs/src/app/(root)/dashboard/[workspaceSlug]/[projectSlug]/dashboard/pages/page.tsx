import { prepareInterval } from "@unprice/analytics"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { PageFilter } from "~/components/analytics/page-filter"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { intervalParserCache, pageParserCache } from "~/lib/searchParams"
import { HydrateClient, batchPrefetch, trpc } from "~/trpc/server"
import { ANALYTICS_STALE_TIME } from "~/trpc/shared"
import TabsDashboard from "../_components/tabs-dashboard"
import { Browsers, BrowsersSkeleton } from "./_components/browsers"
import { Countries, CountriesSkeleton } from "./_components/countries"
import { PageVisits, PageVisitsSkeleton } from "./_components/page-visits"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const maxDuration = 10

export default async function DashboardPages(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const intervalFilter = intervalParserCache.parse(props.searchParams)
  const pageFilter = pageParserCache.parse(props.searchParams)

  const interval = prepareInterval(intervalFilter.intervalFilter)

  batchPrefetch([
    trpc.analytics.getPagesOverview.queryOptions(
      {
        intervalDays: interval.intervalDays,
        pageId: pageFilter.pageId,
      },
      {
        enabled: pageFilter.pageId !== "",
        staleTime: ANALYTICS_STALE_TIME,
      }
    ),
    trpc.analytics.getCountryVisits.queryOptions(
      {
        intervalDays: interval.intervalDays,
        page_id: pageFilter.pageId,
      },
      {
        enabled: pageFilter.pageId !== "",
        staleTime: ANALYTICS_STALE_TIME,
      }
    ),
    trpc.analytics.getBrowserVisits.queryOptions(
      {
        intervalDays: interval.intervalDays,
        page_id: pageFilter.pageId,
      },
      {
        enabled: pageFilter.pageId !== "",
        staleTime: ANALYTICS_STALE_TIME,
      }
    ),
  ])

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <TabsDashboard baseUrl={baseUrl} activeTab="pages" />
        <div className="flex items-center gap-2">
          <IntervalFilter className="md:ml-auto" />
          <PageFilter className="ml-auto" />
        </div>
      </div>
      <HydrateClient>
        <Suspense fallback={<PageVisitsSkeleton isLoading={true} />}>
          <PageVisits />
        </Suspense>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Suspense fallback={<BrowsersSkeleton isLoading={true} />}>
            <Browsers />
          </Suspense>
          <Suspense fallback={<CountriesSkeleton isLoading={true} />}>
            <Countries />
          </Suspense>
        </div>
      </HydrateClient>
    </DashboardShell>
  )
}
