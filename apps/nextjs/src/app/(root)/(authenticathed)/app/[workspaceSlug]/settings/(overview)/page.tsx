import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import { WorkspaceName } from "./_components/workspace-name"

export const preferredRegion = ["fra1"]
export const runtime = "edge"

export default function WorkspaceSettingsPage({
  params,
}: {
  params: { workspaceSlug: string }
}) {
  return (
    <DashboardShell
      header={<HeaderTab title="General Settings" description="Manage your workspace settings" />}

    >
      <WorkspaceName
        workspaceSlug={params.workspaceSlug}
        workspacePromise={api.workspaces.getBySlug({
          slug: params.workspaceSlug,
        })}
      />
    </DashboardShell>
  )
}
