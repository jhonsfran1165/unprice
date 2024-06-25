import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <DashboardShell
      header={<HeaderTab title="General Settings" description="Manage your workspace settings" />}
    >
      {props.children}
    </DashboardShell>
  )
}
