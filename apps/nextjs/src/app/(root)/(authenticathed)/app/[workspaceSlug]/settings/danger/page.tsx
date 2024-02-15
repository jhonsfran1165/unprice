import { DeleteWorkspace } from "./delete-workspace"

export const runtime = "edge"

export default function DangerZonePage({
  params: { workspaceSlug },
}: {
  params: { workspaceSlug: string }
}) {
  return <DeleteWorkspace workspaceSlug={workspaceSlug} />
}
