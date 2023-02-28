"use client"

import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { navBarBySlug, navBarSiteBySlug } from "@/config/dashboard"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export default function SiteContext() {
  const pathname = usePathname()
  const pathnameSite = "/" + useSelectedLayoutSegments().slice(-1)

  const title = pathname.startsWith("/site")
    ? navBarSiteBySlug(pathnameSite)?.title
    : navBarBySlug(pathname)?.title

  return (
    <section>
      <div className="flex h-36 items-center border-b border-base-skin-200 bg-base-skin-900 z-30">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl text-base-text pl-5">
              {(pathname && title) || "Dashboard"}
            </h1>
          </div>
        </MaxWidthWrapper>
      </div>
    </section>
  )
}
