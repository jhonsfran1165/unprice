import { DashboardShell } from "~/components/layout2/dashboard-shell"
import { NewPlanDialog } from "./_components/new-plan"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <DashboardShell
      title="Plans"
      module="project"
      submodule="plans"
      action={<NewPlanDialog />}
    >
      {props.children}
    </DashboardShell>
  )
}
