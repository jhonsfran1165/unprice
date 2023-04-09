import useSWR from "swr"

import { OrganizationProfilesData } from "@/lib/types/supabase"
import { fetcher } from "@/lib/utils"

export default function useOrganizations({
  revalidateOnFocus = true,
  fallbackData = [],
}: {
  revalidateOnFocus?: boolean
  fallbackData?: OrganizationProfilesData[]
} = {}) {
  const { data: organizationProfiles, error } = useSWR<
    OrganizationProfilesData[]
  >(`/api/org`, fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus,
    fallbackData,
  })

  return {
    organizationProfiles,
    error,
    isLoading: !error && !organizationProfiles,
  }
}
