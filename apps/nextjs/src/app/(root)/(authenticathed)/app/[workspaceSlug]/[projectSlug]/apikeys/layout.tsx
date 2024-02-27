import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import TabsNav from "~/components/layout/tabs-nav"
import { PROJECT_TABS_CONFIG } from "~/constants/projects"
import NewApiKeyDialog from "./_components/new-api-key-dialog"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { workspaceSlug, projectSlug } = props.params
  const tabs = Object.values(PROJECT_TABS_CONFIG)

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Api Keys"
          description="All the apis of the system"
          action={<NewApiKeyDialog projectSlug={props.params.projectSlug} />}
        />
      }
      tabs={
        <TabsNav
          tabs={tabs}
          activeTab={PROJECT_TABS_CONFIG.apikeys}
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
