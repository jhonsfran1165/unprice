import { DashboardShell } from "~/components/dashboard-shell"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  return (
    <DashboardShell
      title="Project"
      module="project"
      submodule="settings"
      className="space-y-4"
    >
      {props.children}
    </DashboardShell>
  )
}
