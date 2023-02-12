"use client"

import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
} from "next/navigation"

import useProject from "@/lib/swr/use-project"
import LinkCardPlaceholder from "@/components/shared/link-card-placeholder"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import NoLinksPlaceholder from "@/components/shared/no-links-placeholder"

export default function Test({ data: dataProps }) {
  const { organization, isOwner, error, isLoading } = useProject({
    fallbackData: dataProps,
  })

  if (isLoading) {
    return <span>Loading...</span>
  }

  if (error) {
    return <span>Error: {error.message}</span>
  }

  return (
    <MaxWidthWrapper className="pt-10">
      <ul>
        {organization &&
          organization.map((og) => <li key={og.id}>{og.name}</li>)}
      </ul>
    </MaxWidthWrapper>
  )
}
