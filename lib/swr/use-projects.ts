import useSWR from "swr"

import { useStore } from "@/lib/stores/layout"
import { DataProjectsView } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useProjects({
  revalidateOnFocus = true,
}: {
  revalidateOnFocus?: boolean
}) {
  const { orgSlug } = useStore()

  const { data: projects, error } = useSWR<DataProjectsView[]>(
    !!orgSlug ? `/api/org/${orgSlug}/project` : null,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus,
    }
  )

  return {
    projects,
    error,
    isLoading: !error && !projects,
  }
}
