import { notFound } from "next/navigation"
// import EditorComponent from "~/components/page-builder/editor"
import { EditorPreview } from "~/components/page-builder/editor-preview"
import { api } from "~/trpc/server"

import lz from "lzutf8"

export default async function DomainPage({
  params: { domain },
}: {
  params: {
    domain: string
  }
}) {
  const { page } = await api.pages.getByDomain({
    domain,
  })

  if (!page) {
    notFound()
  }

  // return planVersions.map((planVersion) => (
  //   <PricingCard key={planVersion.id} planVersion={planVersion} />
  // ))

  // return <EditorComponent />

  const json = lz.decompress(lz.decodeBase64(page.content ?? ""))

  return <EditorPreview json={json} />
}
