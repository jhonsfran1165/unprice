import { DashboardShell } from "~/components/dashboard-shell"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  return (
    <DashboardShell title="Api Keys" module="project" submodule="apikeys">
      {props.children}
    </DashboardShell>
  )
}
