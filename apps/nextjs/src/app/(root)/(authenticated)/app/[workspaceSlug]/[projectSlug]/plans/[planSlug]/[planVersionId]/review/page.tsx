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

  return <PricingCard planVersion={planVersion} />
}
