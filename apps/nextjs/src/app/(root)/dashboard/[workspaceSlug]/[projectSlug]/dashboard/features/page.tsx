import { Users } from "lucide-react"
import { notFound } from "next/navigation"
import type { SearchParams } from "nuqs/server"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { intervalDaysParserCache } from "~/lib/searchParams"
import { HydrateClient, api, prefetch, trpc } from "~/trpc/server"
import Stats from "../_components/stats"
import TabsDashboard from "../_components/tabs-dashboard"
import FeatureUsageHeatmap from "./_components/features-heat-map"

export default async function DashboardFeatures(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const filter = intervalDaysParserCache.parse(props.searchParams)

  const activeProject = await api.projects.getBySlug({
    slug: projectSlug,
  })

  if (!activeProject) {
    return notFound()
  }

  // prefetch
  prefetch(
    trpc.analytics.getFeatureHeatmap.queryOptions(
      {
        intervalDays: filter.intervalDays,
      },
      {
        staleTime: 1000 * 60, // 1 minute
      }
    )
  )

  return (
    <DashboardShell>
      <TabsDashboard baseUrl={baseUrl} activeTab="features" />

      <Stats
        stats={[
          {
            total: "10",
            icon: <Users />,
            title: "Total Features",
            description: "Total number of features",
          },
        ]}
      />
      <HydrateClient>
        <FeatureUsageHeatmap />
      </HydrateClient>
    </DashboardShell>
  )
}
