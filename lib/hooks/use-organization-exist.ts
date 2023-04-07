import { useEffect, useState } from "react"
import { useDebounce } from "use-debounce"

export default function useOrganizationExist({
  orgSlug,
}: {
  orgSlug: string
}): boolean {
  const [exist, setExist] = useState(false)
  const [debouncedSlug] = useDebounce(orgSlug, 500)

  useEffect(() => {
    const existOrg = async () => {
      try {
        const data = await fetch(`/api/org/${debouncedSlug}/exist`)
        const org = await data.json()
        if (org?.slug) {
          setExist(true)
        } else {
          setExist(false)
        }
      } catch (error) {
        setExist(false)
      }
    }

    debouncedSlug?.length > 0 && existOrg()
  }, [debouncedSlug])

  return exist
}
