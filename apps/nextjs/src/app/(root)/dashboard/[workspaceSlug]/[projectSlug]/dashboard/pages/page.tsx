import { TabNavigationLink } from "@unprice/ui/tabs-navigation"
import { TabNavigation } from "@unprice/ui/tabs-navigation"
import type { SearchParams } from "nuqs/server"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { SuperLink } from "~/components/super-link"

export const dynamic = "force-dynamic"

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  const { projectSlug, workspaceSlug } = props.params
  const baseUrl = `/${workspaceSlug}/${projectSlug}`

  return (
    <DashboardShell>
      <TabNavigation variant="solid">
        <div className="flex items-center">
          <TabNavigationLink asChild>
            <SuperLink href={`${baseUrl}/dashboard`}>Overview</SuperLink>
          </TabNavigationLink>
          <TabNavigationLink asChild>
            <SuperLink href={`${baseUrl}/dashboard/plans`}>Plans & Features</SuperLink>
          </TabNavigationLink>
          <TabNavigationLink active asChild>
            <SuperLink href={`${baseUrl}/dashboard/pages`}>Pages</SuperLink>
          </TabNavigationLink>
        </div>
      </TabNavigation>
    </DashboardShell>
  )
}
