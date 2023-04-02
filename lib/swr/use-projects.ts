import useSWR from "swr"

import { ProjectsApiResult } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useProjects({
  revalidateOnFocus = true,
  orgSlug,
}: {
  revalidateOnFocus?: boolean
  orgSlug: string
}) {
  const { data: projects, error } = useSWR<ProjectsApiResult[]>(
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
