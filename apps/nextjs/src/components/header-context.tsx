"use client"

import type { DashboardHeader } from "@builderai/config"

import MaxWidthWrapper from "~/components/max-width-wrapper"

export default function HeaderContext({
  dashboardHeader,
}: {
  dashboardHeader: DashboardHeader
}) {
  return (
    <section>
      <div className="z-30 flex h-36 items-center border-b bg-background bg-clip-padding text-background-textContrast">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-normal">{dashboardHeader.title}</h1>
          </div>
        </MaxWidthWrapper>
      </div>
    </section>
  )
}
