"use client"

import { Button } from "@unprice/ui/button"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { toast } from "@unprice/ui/sonner"
import { useParams } from "next/navigation"
import { startTransition } from "react"
import { revalidateAppPath } from "~/actions/revalidate"
import { ConfirmAction } from "~/components/confirm-action"
import { api } from "~/trpc/client"

export const SubscriptionCancelButton = ({
  onConfirmAction,
  subscriptionId,
  variant = "destructive",
}: {
  onConfirmAction?: () => void
  subscriptionId: string
  variant?: "destructive" | "secondary"
}) => {
  const workspaceSlug = useParams().workspaceSlug as string

  const cancelSubscription = api.subscriptions.cancel.useMutation({
    onSuccess: async () => {
      await revalidateAppPath(`/dashboard/${workspaceSlug}/settings/billing`, "page")
    },
  })

  function onCancelSubscription() {
    startTransition(() => {
      toast.promise(
        cancelSubscription.mutateAsync({
          id: subscriptionId,
          endAt: Date.now(),
          metadata: null,
        }),
        {
          loading: "Cancelling subscription...",
          success: "Subscription cancelled",
        }
      )
    })
  }

  return (
    <ConfirmAction
      message="Once you cancel this subscription, you will lose access immediately. If you want to downgrade/upgrade please create a new phase instead. Are you sure you want to cancel this subscription?"
      confirmAction={() => {
        onConfirmAction?.()
        onCancelSubscription()
      }}
    >
      <Button variant={variant} disabled={cancelSubscription.isPending}>
        Cancel Subscription
        {cancelSubscription.isPending && <LoadingAnimation className={"ml-2"} />}
      </Button>
    </ConfirmAction>
  )
}
