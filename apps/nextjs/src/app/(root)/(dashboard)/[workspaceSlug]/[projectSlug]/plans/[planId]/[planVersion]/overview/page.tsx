import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server-http"
import DragDrop from "../../../_components/drag-drop"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

export default async function DashboardPage(props: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planId: string
    planVersion: number
  }
}) {
  const { projectSlug, workspaceSlug, planId, planVersion } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["PRO", "STANDARD", "FREE"],
  })

  const versionData = await api.plan.getVersionById.query({
    planId: planId,
    versionId: planVersion,
    projectSlug: projectSlug,
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-background">
      <DragDrop projectSlug={projectSlug} version={versionData} />
    </div>
  )
}
