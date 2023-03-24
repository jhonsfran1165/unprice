"use client"

import { useEffect, useState } from "react"

import { useStore } from "@/lib/stores/layout"
import { Icons } from "@/components/shared/icons"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export default function SiteContext() {
  const { siteId, orgProfiles } = useStore()

  return (
    <div>
      {siteId ? (
        <div className="flex items-center justify-start">
          <Icons.divider className="hidden h-6 w-6 mx-2 text-background-text gap-0 md:inline-block" />
          <span className="block truncate text-sm font-bold">{"Site"}</span>
        </div>
      ) : null}
    </div>
  )
}
