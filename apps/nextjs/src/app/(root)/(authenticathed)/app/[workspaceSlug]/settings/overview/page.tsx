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
    <WorkspaceName
      workspaceSlug={params.workspaceSlug}
      workspacePromise={api.workspaces.getBySlug({
        slug: params.workspaceSlug,
      })}
    />
  )
}
