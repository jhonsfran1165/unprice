"use client"

import { useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import { useSession } from "@builderai/auth/react"
import { Button } from "@builderai/ui/button"
import { useToast } from "@builderai/ui/use-toast"

import { AUTH_ROUTES } from "~/constants"
import { api } from "~/trpc/client"

export function SubscribeNow(props: { planId: string }) {
  const router = useRouter()
  const session = useSession()
  const toaster = useToast()

  const createSession = api.stripe.createSession.useMutation({
    onSuccess: (data) => {
      if (data.success) router.push(data.url)
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Error creting payment link",
          variant: "destructive",
          description:
            "An issue occurred while creating payment link. Please try again.",
        })
      }
    },
  })

  return (
    <Button
      onClick={() => {
        if (session.status === "unauthenticated")
          router.push(AUTH_ROUTES.SIGNIN)

        createSession.mutate({
          planId: props.planId,
        })
      }}
    >
      Subscribe now
    </Button>
  )
}
