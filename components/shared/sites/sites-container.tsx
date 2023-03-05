"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"

import useSite from "@/lib/swr/use-sites"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
// import LinkFilters from "./link-filters"
import NoLinksPlaceholder from "./no-sites-placeholder"
import LinkCard from "./sites-card"
import LinkCardPlaceholder from "./sites-card-placeholder"

export default function SitesContainer() {
  const { sites, isLoading } = useSite({ revalidateOnFocus: false })

  return (
    <div>
      {/* <LinkFilters /> */}
      <ul className="grid grid-cols-1 gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <LinkCardPlaceholder key={i} />
          ))
        ) : sites.length > 0 ? (
          // sites.map((props) => <LinkCard key={props.id} props={props} />)
          sites?.map((props) => <LinkCardPlaceholder key={props.id} />)
        ) : (
          <NoLinksPlaceholder />
        )}
      </ul>
    </div>
  )
}
