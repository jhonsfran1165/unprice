import { DashboardShell } from "~/components/layout2/dashboard-shell"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <DashboardShell
      title="General Settings"
      module="project"
      submodule="settings"
    >
      {props.children}
    </DashboardShell>
  )
}
