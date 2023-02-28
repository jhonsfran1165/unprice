import useSWR from "swr"

import { Site } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useSite({
  revalidateOnFocus = true,
}: {
  revalidateOnFocus?: boolean
} = {}) {
  const {
    data: sites,
    error,
    isLoading,
  } = useSWR<Site[]>("/api/sites", fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus,
  })

  return {
    sites,
    error,
    isLoading,
  }
}
