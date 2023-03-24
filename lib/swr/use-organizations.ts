import useSWR from "swr"

import { OrganizationProfilesData } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useOrganizations({
  revalidateOnFocus = true,
}: {
  revalidateOnFocus?: boolean
} = {}) {
  const {
    data: organizationProfiles,
    error,
    isLoading,
  } = useSWR<[OrganizationProfilesData]>(`/api/organization`, fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus,
  })

  return {
    organizationProfiles,
    error,
    isLoading,
  }
}
