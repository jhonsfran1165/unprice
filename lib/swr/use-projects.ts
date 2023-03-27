import useSWR from "swr"

import { useStore } from "@/lib/stores/layout"
import { Project } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useProjects({
  revalidateOnFocus = true,
}: {
  revalidateOnFocus?: boolean
} = {}) {
  const { orgId } = useStore()
  const {
    data: projects,
    error,
    isLoading,
  } = useSWR<Project[]>(orgId ? `/api/org/${orgId}/project` : null, fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus,
  })

  return {
    projects,
    error,
    isLoading,
  }
}
