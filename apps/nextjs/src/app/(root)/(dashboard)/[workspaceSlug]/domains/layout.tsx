import HeaderTab from "~/components/header-tab"
import { DashboardShell } from "~/components/layout2/dashboard-shell"
import TabsNav from "~/components/layout2/tabs-nav"

export default function DomainsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const { workspaceSlug } = props.params
  return (
    <DashboardShell
      header={
        <HeaderTab title="Domains" description="Domains for this workspace" />
      }
      tabs={
        <TabsNav
          module="workspace"
          submodule="domains"
          basePath={`/${workspaceSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
