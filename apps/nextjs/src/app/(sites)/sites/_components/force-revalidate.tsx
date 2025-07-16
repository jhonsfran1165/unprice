"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { revalidatePageDomain } from "~/actions/revalidate"

export function ForceRefreshOnPreview({
  isPreview,
  domain,
}: { isPreview: boolean; domain: string }) {
  const router = useRouter()
  useEffect(() => {
    if (isPreview) {
      revalidatePageDomain(domain)
      router.refresh()
    }
  }, [isPreview, router])
  return null
}
