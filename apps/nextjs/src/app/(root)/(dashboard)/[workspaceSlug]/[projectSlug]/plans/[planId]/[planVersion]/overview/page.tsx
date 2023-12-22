import { userCanAccessProject } from "~/lib/project-guard"
import DragDrop from "../../../_components/drag-drop"
import { Features, features } from "../../../_components/features"

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
    <div className="border-b border-l border-r bg-background">
      <DragDrop>
        <Features features={features} />
      </DragDrop>
    </div>
  )
}
