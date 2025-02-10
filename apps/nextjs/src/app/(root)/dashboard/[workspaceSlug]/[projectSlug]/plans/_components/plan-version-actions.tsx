"use client"

import { useRouter } from "next/navigation"
import type { ElementRef } from "react"
import { forwardRef, startTransition } from "react"

import { Button } from "@unprice/ui/button"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { toast } from "@unprice/ui/sonner"

import { ConfirmAction } from "~/components/confirm-action"
import { usePlanFeaturesList } from "~/hooks/use-features"
import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"

const PlanVersionPublish: React.FC<{
  planVersionId: string
  onConfirmAction?: () => void
  classNames?: string
  variant?: "primary" | "custom"
}> = ({ planVersionId, onConfirmAction, classNames, variant = "primary" }) => {
  const router = useRouter()
  const [planFeatures] = usePlanFeaturesList()

  // is valid when all features have config
  const isValidConfig = Object.values(planFeatures).every((f) => f.id !== undefined)

  const publishVersion = api.planVersions.publish.useMutation({
    onSuccess: () => {
      router.refresh()
    },
  })

  function onPublishVersion() {
    startTransition(() => {
      if (!isValidConfig) {
        toastAction("error", "There are some features without configuration. try again")
        return
      }

      toast.promise(
        publishVersion.mutateAsync({
          id: planVersionId,
        }),
        {
          loading: "Publishing...",
          success: "Version published",
        }
      )
    })
  }

  return (
    <ConfirmAction
      message="Once you publish this version, it will be available to your customers. You won't be able to edit it anymore. Are you sure you want to publish this version?"
      confirmAction={() => {
        onConfirmAction?.()
        onPublishVersion()
      }}
    >
      {/* // TODO: create a confetti animation or something in the first version published? */}
      <Button variant={variant} disabled={publishVersion.isPending} className={classNames}>
        Publish version
        {publishVersion.isPending && <LoadingAnimation className={"ml-2"} />}
      </Button>
    </ConfirmAction>
  )
}

export interface PlanVersionDuplicateProps extends React.ComponentPropsWithoutRef<"button"> {
  planVersionId: string
  classNames?: string
  onConfirmAction?: () => void
}

const PlanVersionDuplicate = forwardRef<ElementRef<"button">, PlanVersionDuplicateProps>(
  (props, ref) => {
    const { planVersionId, classNames, onConfirmAction } = props

    const router = useRouter()

    const duplicateVersion = api.planVersions.duplicate.useMutation({
      onSuccess: () => {
        router.refresh()
      },
    })

    function onDuplicateVersion() {
      startTransition(() => {
        toast.promise(
          duplicateVersion.mutateAsync({
            id: planVersionId,
          }),
          {
            loading: "Duplicating...",
            success: "Version duplicated",
          }
        )
      })
    }

    return (
      <ConfirmAction
        message="Are you sure you want to duplicate this version?"
        confirmAction={() => {
          onConfirmAction?.()
          onDuplicateVersion()
        }}
      >
        <Button
          ref={ref}
          className={classNames}
          variant={"custom"}
          disabled={duplicateVersion.isPending}
        >
          Duplicate version
          {duplicateVersion.isPending && <LoadingAnimation className={"ml-2"} />}
        </Button>
      </ConfirmAction>
    )
  }
)

PlanVersionDuplicate.displayName = "PlanVersionDuplicate"

const PlanVersionDeactivate = forwardRef<ElementRef<"button">, PlanVersionDuplicateProps>(
  (props, ref) => {
    const { planVersionId, classNames, onConfirmAction } = props

    const router = useRouter()

    const duplicateVersion = api.planVersions.deactivate.useMutation({
      onSuccess: () => {
        router.refresh()
      },
    })

    function onDeactivateVersion() {
      startTransition(() => {
        toast.promise(
          duplicateVersion.mutateAsync({
            id: planVersionId,
          }),
          {
            loading: "Deactivating...",
            success: "Version deactivated",
          }
        )
      })
    }

    return (
      <ConfirmAction
        message="Are you sure you want to deactivate this version? This version will no longer be available to your customers."
        confirmAction={() => {
          onConfirmAction?.()
          onDeactivateVersion()
        }}
      >
        <Button
          ref={ref}
          className={classNames}
          variant={"custom"}
          disabled={duplicateVersion.isPending}
        >
          Deactivate version
          {duplicateVersion.isPending && <LoadingAnimation className={"ml-2"} />}
        </Button>
      </ConfirmAction>
    )
  }
)

PlanVersionDeactivate.displayName = "PlanVersionDeactivate"

export { PlanVersionDeactivate, PlanVersionDuplicate, PlanVersionPublish }
