import { notFound } from "next/navigation"

import { Card } from "@builderai/ui/card"

import { api } from "~/trpc/server"
import { PlanVersionConfigurator } from "../../_components/plan-version-configurator"
import DragDrop from "../../../_components/drag-drop"
import Stepper from "./_components/stepper"
import VersionOverview from "./_components/version-overview"

export default async function OverviewVersionPage({
  params,
}: {
  params: {
    planSlug: string
    planVersionId: string
  }
}) {
  const { planSlug, planVersionId } = params

  const { planVersion } = await api.planVersions.getById({
    id: planVersionId,
    planSlug,
  })

  if (!planVersion) {
    notFound()
  }

  return (
    <div className="flex flex-col-reverse items-start gap-4 sm:py-0 md:gap-6 lg:flex-row">
      <div className="flex w-full flex-col lg:w-1/4">
        <VersionOverview planVersion={planVersion} />
      </div>
      <div className="flex w-full flex-1 flex-row items-start gap-2 lg:w-3/4">
        {/* // TODO: pass this to a card */}
        <Card className="w-full overflow-hidden">
          <DragDrop>
            <PlanVersionConfigurator planVersion={planVersion} />
          </DragDrop>
        </Card>
        <Stepper className="flex flex-col px-2 sm:px-4" />
      </div>
    </div>
  )
}
