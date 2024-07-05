import { notFound } from "next/navigation"
import EditorComponent from "~/components/editor/components/editor"
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

  // return planVersions.map((planVersion) => (
  //   <PricingCard key={planVersion.id} planVersion={planVersion} />
  // ))

  return <EditorComponent />
}
