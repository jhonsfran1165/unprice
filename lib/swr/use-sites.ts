import useSWR from "swr"

import { useStore } from "@/lib/stores/layout"
import { Site } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useSite({
  revalidateOnFocus = true,
}: {
  revalidateOnFocus?: boolean
} = {}) {
  const { orgId } = useStore()
  const {
    data: sites,
    error,
    isLoading,
  } = useSWR<Site[]>(orgId ? `/api/org/${orgId}/site` : null, fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus,
  })

  return {
    sites,
    error,
    isLoading,
  }
}
