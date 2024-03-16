import { cookies } from "next/headers"

import { api } from "~/trpc/server"
import DragDrop from "../../_components/drag-drop"
import { PlanVersionConfigurator } from "../../_components/plan-version-configurator"

export default async function NewVersionPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: number
  }
}) {
  const { projectSlug, planSlug, planVersionId } = params

  const layout = cookies().get("react-resizable-panels:layout")

  // TODO: fix this
  const defaultLayout = layout ? JSON.parse(layout.value ?? 0) : undefined

  const { planVersion } = await api.plans.getVersionById({
    planSlug: planSlug,
    versionId: planVersionId,
  })

  console.log(planVersion)

  const { features } = await api.features.listByActiveProject()

  return (
    <>
      <div className="flex flex-col">
        <DragDrop projectSlug="projectSlug">
          <PlanVersionConfigurator
            features={features}
            defaultLayout={defaultLayout}
          />
        </DragDrop>
      </div>
    </>
  )
}
