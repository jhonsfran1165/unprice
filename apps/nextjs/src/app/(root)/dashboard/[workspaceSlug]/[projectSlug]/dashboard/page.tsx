import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { BarChart2, Users } from "@unprice/ui/icons"
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
import { api } from "~/trpc/server"
import { Events } from "./_components/events"
import Stats from "./_components/stats"
import TabsDashboard from "./_components/tabs-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`
  const filter = intervalParserCache.parse(props.searchParams)

  // TODO: this prefetch doesn't work here, investigate why
  const [stats, verifications, usage] = await Promise.all([
    await api.analytics.getStats(),
    await api.analytics.getVerifications({
      range: filter.interval,
    }),
    await api.analytics.getUsage({
      range: filter.interval,
    }),
  ])

  return (
    <DashboardShell>
      <TabsDashboard baseUrl={baseUrl} activeTab="overview" />
      {/* TODO: add icons */}
      <Stats
        stats={Object.entries(stats.stats).map(([key, value]) => ({
          total: value.toString(),
          icon: <Users />,
          title: key,
          description: key,
        }))}
      />
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
              chart: () => <VerificationsChart verifications={verifications.verifications} />,
            },
            {
              id: "usage",
              label: "Usage",
              description: "Feature usage recorded for the selected interval.",
              chart: () => <UsageChart usage={usage.usage} />,
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
                <div className="flex h-[450px] flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart2 className="mb-2 h-8 w-8 opacity-30" />
                  <span className="font-medium text-sm">No events yet</span>
                  <span className="mt-1 text-xs">Events will appear here.</span>
                </div>
              </CardContent>
            </Card>
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
    <Card className={cn("flex flex-col justify-between", props.className)}>
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
