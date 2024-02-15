import HeaderTab from "~/components/header-tab"
import { DashboardShell } from "~/components/layout2/dashboard-shell"
import TabsNav from "~/components/layout2/tabs-nav"

export default function WorkspaceOverviewLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const { workspaceSlug } = props.params
  return (
    <DashboardShell
      header={<HeaderTab title="Projects" description="Organize project" />}
      tabs={
        <TabsNav
          module="workspace"
          submodule="overview"
          basePath={`/${workspaceSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
