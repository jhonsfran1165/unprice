import { notFound } from "next/navigation"
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

  return <div>Hello</div>
}
