import { notFound } from "next/navigation"

import { PricingCard } from "~/components/forms/pricing-card"
import { api } from "~/trpc/server"

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
    <div className="flex w-full flex-col items-center justify-center py-12">
      <PricingCard planVersion={planVersion} />
    </div>
  )
}
