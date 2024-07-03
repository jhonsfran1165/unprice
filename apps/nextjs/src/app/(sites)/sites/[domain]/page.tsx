import { notFound } from "next/navigation"
import { PricingCard } from "~/app/(root)/(authenticathed)/app/[workspaceSlug]/[projectSlug]/plans/[planSlug]/[planVersionId]/review/_components/pricing-card"
import { api } from "~/trpc/server"

export default async function DomainPage({
  params: { domain },
}: {
  params: {
    domain: string
  }
}) {
  const { page, planVersions } = await api.pages.getByDomain({
    domain,
  })

  if (!page) {
    notFound()
  }

  return planVersions.map((planVersion) => (
    <PricingCard key={planVersion.id} planVersion={planVersion} />
  ))
}
