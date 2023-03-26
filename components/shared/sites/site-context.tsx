"use client"

import { useEffect, useState } from "react"

import useSite from "@/lib/swr/use-site"
import { Site } from "@/lib/types/supabase"
import { Icons } from "@/components/shared/icons"

export default function SiteContext() {
  const [site, setSite] = useState<Site>()
  const { site: data } = useSite({
    revalidateOnFocus: false,
  })

  useEffect(() => {
    setSite(data)
  }, [data])

  return (
    <div>
      {site ? (
        <div className="flex items-center justify-start">
          <Icons.divider className="hidden h-6 w-6 mx-2 text-background-text gap-0 md:inline-block" />
          <span className="block truncate text-sm font-bold">{site?.name}</span>
        </div>
      ) : null}
    </div>
  )
}
