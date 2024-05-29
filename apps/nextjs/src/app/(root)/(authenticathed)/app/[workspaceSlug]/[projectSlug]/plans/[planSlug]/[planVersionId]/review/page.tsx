import { notFound } from "next/navigation"

import { api } from "~/trpc/server"
import Stepper from "../_components/stepper"
import VersionOverview from "../_components/version-overview"
import { PricingCard } from "./_components/pricing-card"

export default async function ReviewPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
}) {
  const { planSlug, planVersionId, workspaceSlug, projectSlug } = params

  const { planVersion } = await api.planVersions.getById({
    id: planVersionId,
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
        <div className="flex flex-1 justify-center">
          {/* // TODO: pass this to a card */}
          <PricingCard planVersion={planVersion} />
        </div>

        <Stepper
          className="flex flex-col px-2 sm:px-4"
          step="review"
          baseUrl={`/${workspaceSlug}/${projectSlug}/plans/${planSlug}/${planVersion.id}`}
        />
      </div>
    </div>
  )
}
