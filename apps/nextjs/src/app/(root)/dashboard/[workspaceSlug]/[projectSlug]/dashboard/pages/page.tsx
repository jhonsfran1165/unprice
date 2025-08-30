import { prepareInterval, preparePage } from "@unprice/analytics"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { PageFilter } from "~/components/analytics/page-filter"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { intervalParams, pageParams } from "~/lib/searchParams"
import { HydrateClient, api, batchPrefetch, trpc } from "~/trpc/server"
import { ANALYTICS_STALE_TIME } from "~/trpc/shared"
import TabsDashboard from "../_components/tabs-dashboard"
import { Browsers, BrowsersSkeleton } from "./_components/browsers"
import { Countries, CountriesSkeleton } from "./_components/countries"
import { PageVisits, PageVisitsSkeleton } from "./_components/page-visits"

export const dynamic = "force-dynamic"

export default async function DashboardPages(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const intervalFilter = intervalParams(props.searchParams)
  const pageFilter = pageParams(props.searchParams)

  const interval = prepareInterval(intervalFilter.intervalFilter)
  const page = preparePage(pageFilter.pageId)

  batchPrefetch([
    trpc.analytics.getPagesOverview.queryOptions(
      {
        intervalDays: interval.intervalDays,
        pageId: page.pageId,
      },
      {
        staleTime: ANALYTICS_STALE_TIME,
        enabled: page.isSelected,
      }
    ),
    trpc.analytics.getCountryVisits.queryOptions(
      {
        intervalDays: interval.intervalDays,
        page_id: page.pageId,
      },
      {
        staleTime: ANALYTICS_STALE_TIME,
        enabled: page.isSelected,
      }
    ),
    trpc.analytics.getBrowserVisits.queryOptions(
      {
        intervalDays: interval.intervalDays,
        page_id: page.pageId,
      },
      {
        staleTime: ANALYTICS_STALE_TIME,
        enabled: page.isSelected,
      }
    ),
  ])

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <TabsDashboard baseUrl={baseUrl} activeTab="pages" />
        <div className="flex items-center gap-2">
          <IntervalFilter className="md:ml-auto" />
          <PageFilter className="ml-auto" pagesPromise={api.pages.listByActiveProject({})} />
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
