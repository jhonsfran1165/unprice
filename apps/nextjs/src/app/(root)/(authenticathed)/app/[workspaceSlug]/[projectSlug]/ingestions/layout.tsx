import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import TabsNav from "~/components/layout/tabs-nav"
import { PROJECT_TABS_CONFIG } from "~/constants/projects"

export default function ProjectIngestionsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { workspaceSlug, projectSlug } = props.params
  const tabs = Object.values(PROJECT_TABS_CONFIG)
  return (
    <DashboardShell
      header={<HeaderTab title="Ingestions" />}
      tabs={
        <TabsNav
          tabs={tabs}
          activeTab={PROJECT_TABS_CONFIG.ingestions}
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
