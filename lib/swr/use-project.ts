import { useMemo } from "react"
import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
} from "next/navigation"
import useSWR from "swr"

import { Database } from "@/types/database.types"
import { fetcher } from "@/lib/utils"

type Organization = Database["public"]["Tables"]["organization"]["Row"]

export default function useProject({ fallbackData }) {
  // const router = useRouter()
  // const pathname = usePathname()
  // const selectedLayoutSegments = useSelectedLayoutSegments()
  // const selectedLayoutSegment = useSelectedLayoutSegment()
  // const searchParams = useSearchParams()

  // console.log(
  //   JSON.stringify(
  //     {
  //       router: router,
  //       usePathname: pathname,
  //       selectedLayoutSegment: selectedLayoutSegment,
  //       selectedLayoutSegments: selectedLayoutSegments,
  //       useSearchParams: Object.fromEntries(searchParams.entries()),
  //       "useSearchParam('key')": searchParams,
  //     },
  //     null,
  //     2
  //   )
  // )

  const {
    data: organization,
    error,
    isLoading,
  } = useSWR<Organization[]>("/api/organizations/1", fetcher, {
    dedupingInterval: 30000,
    fallbackData,
  })

  // TODO: use this as an example to build your own
  const isOwner = useMemo(() => {
    if (organization && Array.isArray(organization)) {
      return true
    }
  }, [organization])

  return {
    organization,
    isOwner,
    error,
    isLoading,
  }
}
