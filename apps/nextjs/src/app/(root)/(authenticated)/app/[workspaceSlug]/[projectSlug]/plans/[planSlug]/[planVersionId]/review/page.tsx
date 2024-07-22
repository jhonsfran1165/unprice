import { notFound } from "next/navigation"

import { api } from "~/trpc/server"
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
  const { planVersion } = await api.planVersions.getById({
    id: params.planVersionId,
  })

  if (!planVersion) {
    notFound()
  }

  return (
    <div className="flex w-full flex-col items-center justify-center space-y-4">
      <PricingCard planVersion={planVersion} />
    </div>
  )
}
