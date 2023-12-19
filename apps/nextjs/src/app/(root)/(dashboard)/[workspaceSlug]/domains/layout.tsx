import { DashboardShell } from "~/components/layout2/dashboard-shell"

export default function DomainsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <DashboardShell
      title="Domains"
      module="workspace"
      description="Domains for this workspace"
      submodule="domains"
    >
      {props.children}
    </DashboardShell>
  )
}
