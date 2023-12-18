import { DashboardShell } from "~/components/dashboard-shell"
import { NewCanvaDialog } from "./_components/new-canva"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <DashboardShell
      title="Cnavas"
      module="project"
      submodule="canvas"
      action={<NewCanvaDialog />}
    >
      {props.children}
    </DashboardShell>
  )
}
