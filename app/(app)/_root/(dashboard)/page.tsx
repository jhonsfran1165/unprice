"use client"

import { SiteSkeleton } from "@/components/shared/layout/site-skeleton"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import NoLinksPlaceholder from "@/components/shared/sites/no-sites-placeholder"
import LinkCardPlaceholder from "@/components/shared/sites/sites-card-placeholder"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

export default function IndexPage() {
  return (
    <MaxWidthWrapper className="pt-10">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SiteSkeleton isLoading={false} />
          <SiteSkeleton isLoading={false} />
          <SiteSkeleton isLoading={false} />
        </div>
      </div>
    </MaxWidthWrapper>
  )
}
