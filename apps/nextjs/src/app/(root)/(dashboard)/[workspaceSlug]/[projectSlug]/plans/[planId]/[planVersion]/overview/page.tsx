import { userCanAccessProject } from "~/lib/project-guard"
import DragDrop from "../../../_components/drag-drop"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

export default async function DashboardPage(props: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planId: string
    planVersion: string
  }
}) {
  console.log("props", props)
  const { projectSlug, workspaceSlug, planId, planVersion } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["PRO", "STANDARD", "FREE"],
  })

  return (
    <div className="flex flex-1 flex-col rounded-lg border bg-background">
      <DragDrop />
    </div>
  )
}
