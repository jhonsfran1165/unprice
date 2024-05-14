"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@builderai/ui/button"
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { ConfirmAction } from "~/components/confirm-action"
import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"
import { usePlanFeaturesList } from "./use-features"

const PlanVersionPublish = ({ planVersionId }: { planVersionId: string }) => {
  const router = useRouter()
  const [planFeatures] = usePlanFeaturesList()

  // is valid when all features have config
  const isValidConfig = Object.values(planFeatures).every(
    (f) => f.id !== undefined
  )

  const publishVersion = api.planVersions.publish.useMutation({
    onSuccess: () => {
      toastAction("updated")
      router.refresh()
    },
  })

  function onPublishVersion() {
    startTransition(() => {
      if (!isValidConfig) {
        toastAction(
          "error",
          "There are some features without configuration. try again"
        )
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

const PlanVersionDuplicate = ({
  planVersionId,
  classNames,
}: {
  planVersionId: string
  classNames?: string
}) => {
  const router = useRouter()

  const duplicateVersion = api.planVersions.duplicate.useMutation({
    onSuccess: () => {
      toastAction("saved")
      router.refresh()
    },
  })

  function onDuplicateVersion() {
    startTransition(() => {
      void duplicateVersion.mutateAsync({
        id: planVersionId,
      })
    })
  }

  return (
    <ConfirmAction
      message="Once you publish this version, it will be available to your customers. You won't be able to edit it anymore. Are you sure you want to publish this version?"
      confirmAction={() => {
        onDuplicateVersion()
      }}
    >
      {/* // TODO: create a confetti animation or something in the first version published? */}
      <Button
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

export { PlanVersionDuplicate, PlanVersionPublish }
