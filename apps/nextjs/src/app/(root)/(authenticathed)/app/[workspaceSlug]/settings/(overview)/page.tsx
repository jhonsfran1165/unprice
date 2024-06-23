import { notFound } from "next/navigation"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import { DeleteWorkspace } from "./_components/delete-workspace"
import { WorkspaceName } from "./_components/workspace-name"

export const preferredRegion = ["fra1"]
export const runtime = "edge"

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: { workspaceSlug: string }
}) {
  const { workspaceSlug } = params
  const { workspace } = await api.workspaces.getBySlug({
    slug: workspaceSlug,
  })

  if (!workspace) {
    return notFound()
  }

  return (
    <DashboardShell
      header={<HeaderTab title="General Settings" description="Manage your workspace settings" />}
    >
      <WorkspaceName workspace={workspace} />

      <DeleteWorkspace workspace={workspace} />
    </DashboardShell>
  )
}
