"use client"
import { useRouter } from "next/navigation"

import { Button } from "@unprice/ui/button"
import { api } from "~/trpc/client"

export function SubscribeNow(props: { planId: string }) {
  const router = useRouter()

  const createSession = api.stripe.createSession.useMutation({
    onSuccess: (data) => {
      if (data.success) router.push(data.url)
    },
  })

  return (
    <Button
      onClick={() => {
        createSession.mutate({
          planId: props.planId,
        })
      }}
    >
      Subscribe now
    </Button>
  )
}
