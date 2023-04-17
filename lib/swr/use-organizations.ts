import useSWR from "swr"

import { OrganizationViewData } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useOrganizations({
  revalidateOnFocus = true,
  fallbackData = [],
}: {
  revalidateOnFocus?: boolean
  fallbackData?: OrganizationViewData[]
} = {}) {
  const { data: organizationProfiles, error } = useSWR<OrganizationViewData[]>(
    `/api/org`,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus,
      fallbackData,
    }
  )

  return {
    organizationProfiles,
    error,
    isLoading: !error && !organizationProfiles,
  }
}
