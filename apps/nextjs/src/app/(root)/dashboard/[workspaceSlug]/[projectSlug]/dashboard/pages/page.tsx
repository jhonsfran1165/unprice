import type { SearchParams } from "nuqs/server"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import TabsDashboard from "../_components/tabs-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`

  return (
    <DashboardShell>
      <TabsDashboard baseUrl={baseUrl} activeTab="pages" />
    </DashboardShell>
  )
}
