import HeaderTab from "~/components/header-tab"
import { DashboardShell } from "~/components/layout2/dashboard-shell"
import TabsNav from "~/components/layout2/tabs-nav"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { workspaceSlug, projectSlug } = props.params
  return (
    <DashboardShell
      header={<HeaderTab title="Api Keys" />}
      tabs={
        <TabsNav
          module="project"
          submodule="apikeys"
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
