"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"

import type { RouterOutputs } from "@builderai/api"

import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"
import { usePlanFeaturesList } from "../[planSlug]/_components/use-features"

const CreateNewVersion = ({
  projectSlug,
  workspaceSlug,
  plan,
  planVersionId,
}: {
  projectSlug: string
  workspaceSlug: string
  plan: RouterOutputs["plans"]["getBySlug"]["plan"]
  planVersionId?: number
}) => {
  const router = useRouter()
  const [planFeatures] = usePlanFeaturesList()

  const createVersion = api.plans.createVersion.useMutation({
    onSuccess: (data) => {
      const { planVersion } = data
      toastAction("success")
      router.push(
        `/${workspaceSlug}/${projectSlug}/plans/${plan?.slug}/${planVersion?.version}`
      )
    },
  })

  const updateVersion = api.plans.updateVersion.useMutation({
    onSuccess: () => {
      toastAction("updated")
      router.refresh()
    },
  })

  function onUpdateVersion() {
    startTransition(() => {
      if (plan?.id === undefined) {
        toastAction("error", "Plan id is undefined")
        return
      }

      if (planVersionId === undefined) {
        toastAction("error", "Plan version id is undefined")
        return
      }

      void updateVersion.mutateAsync({
        planId: plan.id,
        featuresConfig: planFeatures.planFeatures,
        addonsConfig: planFeatures.planAddons,
        versionId: planVersionId,
      })
    })
  }

  function onCreateVersion() {
    startTransition(() => {
      if (plan?.id === undefined) {
        toastAction("error", "Plan id is undefined")
        return
      }

      void createVersion.mutateAsync({
        planId: plan.id,
        featuresConfig: planFeatures.planFeatures,
        addonsConfig: planFeatures.planAddons,
        projectId: plan.projectId,
      })
    })
  }

  return (
    <div className="sm:col-span-full">
      <SubmitButton
        variant={"custom"}
        isSubmitting={createVersion.isPending}
        isDisabled={createVersion.isPending}
        label={"Save version"}
        onClick={planVersionId ? onUpdateVersion : onCreateVersion}
      />
    </div>
  )
}

export default CreateNewVersion
