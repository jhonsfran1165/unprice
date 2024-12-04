"use client"

import { Button } from "@unprice/ui/button"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { useParams } from "next/navigation"
import { startTransition } from "react"
import { toast } from "sonner"
import { revalidateAppPath } from "~/actions/revalidate"
import { ConfirmAction } from "~/components/confirm-action"
import { api } from "~/trpc/client"

export const CancelSubscriptionPhaseButton = ({
  onConfirmAction,
  subscriptionPhaseId,
  variant = "destructive",
}: {
  onConfirmAction?: () => void
  subscriptionPhaseId: string
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
          id: subscriptionPhaseId,
          endAt: Date.now(),
          metadata: {
            reason: "user_requested",
          },
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
      message="Once you cancel this plan, you will lose access to all the features of the plan. Are you sure you want to cancel this plan?"
      confirmAction={() => {
        onConfirmAction?.()
        onCancelSubscription()
      }}
    >
      <Button variant={variant} size={"sm"} disabled={cancelSubscription.isPending}>
        Cancel Plan
        {cancelSubscription.isPending && <LoadingAnimation className={"ml-2"} />}
      </Button>
    </ConfirmAction>
  )
}
