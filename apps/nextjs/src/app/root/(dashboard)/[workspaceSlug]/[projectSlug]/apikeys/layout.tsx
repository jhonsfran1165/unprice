import { DashboardShell } from "~/components/dashboard-shell"

export default function ApiKeyLayout(props: {
  params: { projectSlug: string; workspaceSlug: string }
  children: React.ReactNode
}) {
  return (
    <DashboardShell title="Api Keys" module="project" submodule="apikeys">
      {props.children}
    </DashboardShell>
  )
}
