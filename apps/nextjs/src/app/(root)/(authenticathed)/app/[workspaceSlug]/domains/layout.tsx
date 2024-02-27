import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import TabsNav from "~/components/layout/tabs-nav"
import { WORKSPACE_TABS_CONFIG } from "~/constants/workspaces"

export default function DomainsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const tabs = Object.values(WORKSPACE_TABS_CONFIG)
  return (
    <DashboardShell
      header={
        <HeaderTab title="Domains" description="Domains for this workspace" />
      }
      tabs={
        <TabsNav
          tabs={tabs}
          activeTab={WORKSPACE_TABS_CONFIG.domains}
          basePath={`/${props.params.workspaceSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
