import { notFound } from "next/navigation"

export default function SitePage({
  params,
  searchParams,
}: {
  params: { linkId: string }
  searchParams: { preview?: string }
}) {
  return notFound()
}
