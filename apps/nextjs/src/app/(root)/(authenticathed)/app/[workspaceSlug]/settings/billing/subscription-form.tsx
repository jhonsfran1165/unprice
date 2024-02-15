"use client"

import { TRPCClientError } from "@trpc/client"

import { Button } from "@builderai/ui/button"
import { useToast } from "@builderai/ui/use-toast"

import { api } from "~/trpc/client"

export function SubscriptionForm(props: { hasSubscription: boolean }) {
  const toaster = useToast()
  const createSession = api.stripe.createSession.useMutation({
    onSettled: (data) => {
      if (data?.url) window.location.href = data?.url
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "The url could not be generated",
          variant: "destructive",
        })
      }
    },
  })

  return (
    <Button
      onClick={() => {
        createSession.mutate({ planId: "" })
      }}
    >
      {props.hasSubscription ? "Manage Subscription" : "Upgrade"}
    </Button>
  )
}
