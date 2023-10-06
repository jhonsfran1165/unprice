import { DashboardShell } from "~/components/dashboard-shell"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  return (
    <DashboardShell
      title="Ingestion"
      module="project"
      submodule="ingestions"
      className="space-y-4"
    >
      {props.children}
    </DashboardShell>
  )
}
