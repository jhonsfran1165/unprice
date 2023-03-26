import useSWR from "swr"

import { useStore } from "@/lib/stores/layout"
import { Site } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useSite({
  revalidateOnFocus = true,
}: {
  revalidateOnFocus?: boolean
} = {}) {
  const { orgId, siteId } = useStore()
  const {
    data: site,
    error,
    isLoading,
  } = useSWR<Site>(
    orgId && siteId ? `/api/org/${orgId}/site/${siteId}` : null,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus,
    }
  )

  return {
    site,
    error,
    isLoading,
  }
}
