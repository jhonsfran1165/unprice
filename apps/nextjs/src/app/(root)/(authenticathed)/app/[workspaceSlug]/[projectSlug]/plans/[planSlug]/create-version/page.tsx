import { PlanVersionConfigurator } from "../_components/plan-version-configurator"
import DragDrop from "../../_components/drag-drop"

export default function NewVersionPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
}) {
  const { planSlug, planVersionId } = params

  return (
    <DragDrop>
      <PlanVersionConfigurator
        isCreatingNewVersion
        planSlug={planSlug}
        planVersionId={planVersionId}
      />
    </DragDrop>
  )
}
