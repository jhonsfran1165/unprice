"use client"

import { useStore } from "@/lib/stores/layout"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export default function HeaderContext() {
  const { contextHeader, orgSlug } = useStore()

  if (!orgSlug) return null

  return (
    <section>
      <div className="z-30 flex h-36 items-center border-b bg-primary-bgSubtle">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <h1 className="pl-5 text-2xl">{contextHeader}</h1>
          </div>
        </MaxWidthWrapper>
      </div>
    </section>
  )
}
