import { DashboardShell } from "~/components/dashboard-shell"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <DashboardShell title="Dashboard" module="project" submodule="overview">
      {props.children}
    </DashboardShell>
  )
}
