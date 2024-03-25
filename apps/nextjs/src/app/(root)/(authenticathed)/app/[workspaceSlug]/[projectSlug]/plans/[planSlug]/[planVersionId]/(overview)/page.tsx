import DragDrop from "../../_components/drag-drop"
import { PlanVersionConfigurator } from "../../_components/plan-version-configurator"

export default function OverviewVersionPage({
  params,
}: {
  params: {
    planSlug: string
    planVersionId: string
  }
}) {
  const { planSlug, planVersionId } = params

  return (
    <DragDrop>
      <PlanVersionConfigurator
        planSlug={planSlug}
        planVersionId={planVersionId}
      />
    </DragDrop>
  )
}
