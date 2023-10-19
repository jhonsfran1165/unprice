"use client"

import { useRouter } from "next/navigation"

import { useSession } from "@builderai/auth"
import { Button } from "@builderai/ui/button"

import { api } from "~/trpc/client"

export function SubscribeNow(props: { planId: string }) {
  const router = useRouter()
  const session = useSession()

  return (
    <Button
      onClick={async () => {
        if (!session.isSignedIn) router.push("/signin")

        const billingPortal = await api.stripe.createSession.mutate({
          planId: props.planId,
        })
        if (billingPortal.success) router.push(billingPortal.url)
      }}
    >
      Subscribe now
    </Button>
  )
}
