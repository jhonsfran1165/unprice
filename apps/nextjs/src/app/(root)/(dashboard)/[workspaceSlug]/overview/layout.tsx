import { DashboardShell } from "~/components/layout2/dashboard-shell"

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
