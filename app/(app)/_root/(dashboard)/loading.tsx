"use client"

import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { SiteSkeleton } from "@/components/shared/sites/site-skeleton"

export default function LoadingPage() {
  return (
    <MaxWidthWrapper className="pt-10">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SiteSkeleton isLoading={true} />
          <SiteSkeleton isLoading={true} />
          <SiteSkeleton isLoading={true} />
        </div>
      </div>
    </MaxWidthWrapper>
  )
}
