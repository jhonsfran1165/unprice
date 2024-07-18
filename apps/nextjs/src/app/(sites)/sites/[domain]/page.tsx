import lz from "lzutf8"
import { notFound } from "next/navigation"
import { EditorPreview } from "~/components/page-builder/editor-preview"
import { getPageData } from "~/lib/fetchers"

export default async function DomainPage({
  params: { domain },
}: {
  params: {
    domain: string
  }
}) {
  // we use `getPageData` to fetch the page data and cache it. Instead of using `api.pages.findFirst` directly
  const page = await getPageData(domain)

  if (!page) {
    notFound()
  }

  const data = lz.decompress(lz.decodeBase64(page.content ?? "")) as string

  return <EditorPreview data={data} />
}
