import HeaderTab from "~/components/header-tab"
import { DashboardShell } from "~/components/layout2/dashboard-shell"
import SidebarMenuSubTabs from "~/components/layout2/menu-siderbar-subtabs"
import TabsNav from "~/components/layout2/tabs-nav"
import SidebarNav from "~/components/sidebar"

// TODO: find a way to add invite member button without adding too much bundle to the layout
export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { workspaceSlug, projectSlug } = props.params

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
          module="project"
          submodule="settings"
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
      sidebar={
        <SidebarNav
          module="project"
          submodule="settings"
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
      sidebartabs={
        <SidebarMenuSubTabs
          module="project"
          submodule="settings"
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
