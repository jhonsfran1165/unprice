import { DashboardShell } from "~/components/dashboard-shell"

export default function WorkspaceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  return (
    <DashboardShell
      title="Projects"
      module="workspace"
      description="Organize project"
      submodule="overview"
    >
      {props.children}
    </DashboardShell>
  )
}
