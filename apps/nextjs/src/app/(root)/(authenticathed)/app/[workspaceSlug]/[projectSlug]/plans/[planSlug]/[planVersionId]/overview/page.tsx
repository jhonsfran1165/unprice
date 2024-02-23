import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import DragDrop from "../../../_components/drag-drop"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

export default async function DashboardPage(props: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: number
  }
}) {
  const { projectSlug, planSlug, planVersionId } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["PRO", "FREE"],
  })

  const { planVersion } = await api.plans.getVersionById({
    planSlug: planSlug,
    versionId: planVersionId,
    projectSlug: projectSlug,
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-background">
      <DragDrop projectSlug={projectSlug} version={planVersion} />
    </div>
  )
}
