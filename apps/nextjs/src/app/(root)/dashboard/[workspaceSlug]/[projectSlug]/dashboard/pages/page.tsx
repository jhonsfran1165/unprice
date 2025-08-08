import { prepareInterval } from "@unprice/analytics"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { IntervalFilter } from "~/components/analytics/interval-filter"
import { PageFilter } from "~/components/analytics/page-filter"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { intervalParserCache, pageParserCache } from "~/lib/searchParams"
import { HydrateClient, prefetch, trpc } from "~/trpc/server"
import TabsDashboard from "../_components/tabs-dashboard"
import { PageVisits, PageVisitsSkeleton } from "./_components/page-visits"

export default async function DashboardPages(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const intervalFilter = intervalParserCache.parse(props.searchParams)
  const pageFilter = pageParserCache.parse(props.searchParams)

  const interval = prepareInterval(intervalFilter.intervalFilter)

  // prefetch the page visits
  prefetch(
    trpc.analytics.getPagesOverview.queryOptions(
      {
        intervalDays: interval.intervalDays,
        pageId: pageFilter.pageId,
      },
      {
        enabled: !!pageFilter.pageId && pageFilter.pageId !== "",
        staleTime: 1000 * 60 * 1, // 1 minute
      }
    )
  )

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <TabsDashboard baseUrl={baseUrl} activeTab="pages" />
        <div className="flex items-center gap-2">
          <IntervalFilter className="ml-auto" />
          <PageFilter className="ml-auto" />
        </div>
      </div>
      <HydrateClient>
        <Suspense fallback={<PageVisitsSkeleton />}>
          <PageVisits />
        </Suspense>
      </HydrateClient>
    </DashboardShell>
  )
}
