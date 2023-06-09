import useSWR from "swr"

import { useStore } from "@/lib/stores/layout"
import { DataProjectsView } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useProjects({
  revalidateOnFocus = false,
}: {
  revalidateOnFocus?: boolean
}) {
  const { orgSlug } = useStore()
  console.log("🚀 ~ file: use-projects.ts:13 ~ orgSlug:", orgSlug)

  const { data: projects, error } = useSWR<DataProjectsView[]>(
    !!orgSlug ? `/api/org/${orgSlug}/project` : null,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus,
    }
  )

  console.log("🚀 ~ file: use-projects.ts:16 ~ error:", error)


  return {
    projects,
    error,
    isLoading: !error && !projects,
  }
}
