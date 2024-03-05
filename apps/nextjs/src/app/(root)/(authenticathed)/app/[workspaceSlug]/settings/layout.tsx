import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import SidebarNav from "~/components/layout/sidebar"
import TabsNav from "~/components/layout/tabs-nav"
import { WORKSPACE_TABS_CONFIG } from "~/constants/workspaces"

// TODO: find a way to add invite member button without adding too much bundle to the layout
export default function WorkspaceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const { workspaceSlug } = props.params
  const tabs = Object.values(WORKSPACE_TABS_CONFIG)

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="General Settings"
          description="Manage your workspace settings"
        />
      }
      tabs={
        <TabsNav
          tabs={tabs}
          activeTab={WORKSPACE_TABS_CONFIG.settings}
          basePath={`/${workspaceSlug}`}
        />
      }
      sidebar={
        <SidebarNav
          activeTab={WORKSPACE_TABS_CONFIG.settings}
          basePath={`/${workspaceSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
