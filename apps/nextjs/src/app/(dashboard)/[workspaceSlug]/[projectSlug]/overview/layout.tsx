import { DashboardShell } from "~/components/dashboard-shell"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  return (
    <DashboardShell
      title="Dashboard"
      module="project"
      submodule="overview"
      className="space-y-4"
    >
      {props.children}
    </DashboardShell>
  )
}
