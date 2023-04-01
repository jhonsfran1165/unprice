import useSWR from "swr"

import { useStore } from "@/lib/stores/layout"
import { Project } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useProject({
  revalidateOnFocus = true,
}: {
  revalidateOnFocus?: boolean
} = {}) {
  const { orgSlug, projectId } = useStore()
  const {
    data: project,
    error,
    isLoading,
  } = useSWR<Project>(
    orgSlug && projectId ? `/api/org/${orgSlug}/project/${projectId}` : null,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus,
    }
  )

  return {
    project,
    error,
    isLoading,
  }
}
