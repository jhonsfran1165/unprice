"use client"

import { useRouter } from "next/navigation"
import type { ElementRef } from "react"
import { forwardRef, startTransition } from "react"

import { Button } from "@unprice/ui/button"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { toast } from "sonner"

import { ConfirmAction } from "~/components/confirm-action"
import { getErrorMessage } from "~/lib/handle-error"
import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"
import { usePlanFeaturesList } from "./use-features"

const PlanVersionPublish: React.FC<{ planVersionId: string }> = ({ planVersionId }) => {
  const router = useRouter()
  const [planFeatures] = usePlanFeaturesList()

  // is valid when all features have config
  const isValidConfig = Object.values(planFeatures).every((f) => f.id !== undefined)

  const publishVersion = api.planVersions.publish.useMutation({
    onSuccess: () => {
      toastAction("updated")
      router.refresh()
    },
  })

  function onPublishVersion() {
    startTransition(() => {
      if (!isValidConfig) {
        toastAction("error", "There are some features without configuration. try again")
        return
      }

      void publishVersion.mutateAsync({
        id: planVersionId,
      })
    })
  }

  return (
    <ConfirmAction
      message="Once you publish this version, it will be available to your customers. You won't be able to edit it anymore. Are you sure you want to publish this version?"
      confirmAction={() => {
        onPublishVersion()
      }}
    >
      {/* // TODO: create a confetti animation or something in the first version published? */}
      <Button variant={"primary"} disabled={publishVersion.isPending}>
        Published
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
            error: (err) => getErrorMessage(err),
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

export { PlanVersionDuplicate, PlanVersionPublish }
