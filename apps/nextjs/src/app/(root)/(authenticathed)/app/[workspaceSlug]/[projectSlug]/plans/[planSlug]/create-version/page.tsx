import DragDrop from "../_components/drag-drop"
import { PlanVersionConfigurator } from "../_components/plan-version-configurator"

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
    <div className="flex flex-col">
      <DragDrop>
        <PlanVersionConfigurator
          isCreatingNewVersion
          planSlug={planSlug}
          planVersionId={planVersionId}
        />
      </DragDrop>
    </div>
  )
}
