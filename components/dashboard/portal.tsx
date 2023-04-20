"use client"

import { useRouter } from "next/navigation"

import { useStore } from "@/lib/stores/layout"
import { fetchAPI } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function StripePortal() {
  const { orgSlug, orgData, orgProfiles } = useStore()
  const router = useRouter()

  return (
    <Button
      className="button-primary w-28"
      onClick={async () => {
        try {
          // setClicked(true);
          const url = await fetchAPI({
            url: "/api/stripe/portal",
            method: "POST",
            data: { orgSlug },
          })

          console.log(url)

          router.push(url)
        } catch (error) {
          console.log(error)
        }
      }}
    >
      StripePortal
    </Button>
  )
}
