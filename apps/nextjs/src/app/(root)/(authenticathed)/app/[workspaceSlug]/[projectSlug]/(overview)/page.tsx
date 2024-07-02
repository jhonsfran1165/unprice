import { formatRelative } from "date-fns"
import { Suspense } from "react"

import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { Activity, ChevronRight, CreditCard, DollarSign, Users } from "@builderai/ui/icons"
import { cn } from "@builderai/ui/utils"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { SuperLink } from "~/components/super-link"
import { api } from "~/trpc/server"
import { AnalyticsCard } from "../_components/analytics-card"
import BarList from "../_components/dashboards/bar-list"
import { LoadingCard } from "../_components/loading-card"

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { projectSlug, workspaceSlug } = props.params

  const verifications = [
    { name: "/home", value: 843 },
    { name: "/imprint", value: 46 },
    { name: "/cancellation", value: 3 },
    { name: "/blocks", value: 108 },
    { name: "/documentation", value: 384 },
    { name: "/asdad", value: 384 },
    { name: "/rere", value: 384 },
    { name: "/fdfd", value: 384 },
    { name: "/ere", value: 384 },
    { name: "/434", value: 600 },
  ]

  const usage = [
    { name: "/dsd", value: 46655645 },
    { name: "/vcv", value: 46 },
    { name: "/cancdfdfellation", value: 3 },
    { name: "/ere", value: 1048 },
    { name: "/asd", value: 3842 },
  ]

  return (
    <DashboardShell>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-muted-foreground text-xs">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-muted-foreground text-xs">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <CreditCard className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-muted-foreground text-xs">+19% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-muted-foreground text-xs">+201 since last hour</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <AnalyticsCard
          className="w-full md:w-2/3"
          title="Feature Verifications & Usage"
          description="Feature verifications and usage recorded in the last 30 days."
          tabs={[
            { id: "verifications", label: "Verifications", data: verifications },
            { id: "usage", label: "Usage", data: usage },
          ]}
          defaultTab="verifications"
          expandLimit={5}
          hasMore={true}
        >
          {({ limit, tab, data }) => <BarList tab={tab} data={data} limit={limit} />}
        </AnalyticsCard>

        <Suspense
          fallback={
            <LoadingCard
              title="Recent Ingestions"
              description="Loading recent ingestions..."
              className="col-span-7 md:col-span-2 lg:col-span-3"
            />
          }
        >
          <RecentIngestions
            className="w-full md:w-1/3"
            projectSlug={projectSlug}
            workspaceSlug={workspaceSlug}
          />
        </Suspense>
      </div>
    </DashboardShell>
  )
}

function IngestionCard(props: {
  projectSlug: string
  workspaceSlug: string
  ingestion: RouterOutputs["ingestions"]["list"][number]
}) {
  const { ingestion } = props
  const { adds, subs } = ingestion

  const N_SQUARES = 5
  const addSquares = Math.round((adds / (adds + subs)) * N_SQUARES)

  const truncatedHash = ingestion.hash.slice(0, 15)

  return (
    <SuperLink href={`/${props.workspaceSlug}/${props.projectSlug}/ingestions/${ingestion.id}`}>
      <div className="hover:bg-muted flex items-center rounded p-1">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">{truncatedHash}</p>
          <p className="text-muted-foreground text-sm">
            {formatRelative(new Date(ingestion.createdAt), new Date())}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-center text-sm">
          <div>
            +{adds} -{subs}
          </div>
          <div className="flex gap-[2px]">
            {new Array(N_SQUARES).fill(null).map((_, i) => (
              <span
                key={Math.random()}
                className={cn(
                  "inline-block h-2 w-2",
                  i < addSquares ? "bg-green-500" : "bg-red-500",
                  adds + subs === 0 && "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>

        <ChevronRight className="ml-2 h-4 w-4" />
      </div>
    </SuperLink>
  )
}

async function RecentIngestions(props: {
  projectSlug: string
  workspaceSlug: string
  className?: string
}) {
  const ingestions = await api.ingestions.list({
    projectSlug: props.projectSlug,
    limit: 5,
  })

  return (
    <Card className={cn("flex flex-col", props.className)}>
      <CardHeader>
        <CardTitle>Recent Ingestions</CardTitle>
        <CardDescription>
          {ingestions.length} ingestion{ingestions.length > 1 ? "s" : null} recorded this period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ingestions.map((ingestion) => (
          <IngestionCard
            key={ingestion.id}
            ingestion={ingestion}
            projectSlug={props.projectSlug}
            workspaceSlug={props.workspaceSlug}
          />
        ))}
      </CardContent>
      <CardFooter>
        <Button size="sm" className="ml-auto">
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
