"use client"

import useSite from "@/lib/swr/use-sites"
import { SiteCard } from "@/components/shared/sites/site-card"
import { SiteSkeleton } from "@/components/shared/sites/site-skeleton"
import NoLinksPlaceholder from "./no-sites-placeholder"

export function SitesContainer() {
  const { sites, isLoading } = useSite({ revalidateOnFocus: false })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SiteSkeleton isLoading={true} key={i} />
          ))
        ) : sites && sites.length > 0 ? (
          // sites.map((props) => <LinkCard key={props.id} props={props} />)
          sites?.map((site) => <SiteCard key={site.id} site={site} />)
        ) : (
          <NoLinksPlaceholder />
        )}
      </div>
    </div>
  )
}
