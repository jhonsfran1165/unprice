import { notFound } from "next/navigation"
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

  const data = lz.decompress(lz.decodeBase64(page.content ?? "")) as string

  return <EditorPreview data={data} />
}
