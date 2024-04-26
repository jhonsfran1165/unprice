"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"

import type { RouterOutputs } from "@builderai/api"
import type { PlanVersionFeature } from "@builderai/db/validators"
import { Separator } from "@builderai/ui/separator"

import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"
import { usePlanFeaturesList } from "./use-features"
import { VersionActions } from "./version-actions"

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

  // is valid when all features have config
  const isValidConfig = Object.values(planFeatures).every(
    (features: PlanVersionFeature[]) => {
      return features.every((feature) => {
        return feature.config !== undefined
      })
    }
  )

  const createVersion = api.plans.createVersion.useMutation({
    onSuccess: (data) => {
      const { planVersion } = data
      toastAction("success")

      router.refresh()
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
      if (!isValidConfig) {
        toastAction(
          "error",
          "Please save configuration for each feature before saving"
        )
        return
      }

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
        versionId: planVersionId,
      })
    })
  }

  function onCreateVersion() {
    startTransition(() => {
      if (!isValidConfig) {
        toastAction(
          "error",
          "Please save configuration for each feature before saving"
        )
        return
      }

      if (plan?.id === undefined) {
        toastAction("error", "Plan id is undefined")
        return
      }

      void createVersion.mutateAsync({
        planId: plan.id,
        featuresConfig: planFeatures.planFeatures,
        projectId: plan.projectId,
      })
    })
  }

  return (
    <div className="button-primary flex items-center space-x-1 rounded-md ">
      <div className="sm:col-span-full">
        <SubmitButton
          variant={"custom"}
          isSubmitting={
            planVersionId ? updateVersion.isPending : createVersion.isPending
          }
          isDisabled={
            planVersionId ? updateVersion.isPending : createVersion.isPending
          }
          label={planVersionId ? "Update version" : "Save version"}
          onClick={planVersionId ? onUpdateVersion : onCreateVersion}
        />
      </div>

      <Separator orientation="vertical" className="h-[20px] p-0" />

      <VersionActions planId={plan.id} versionId={Number(planVersionId)} />
    </div>
  )
}

export default CreateNewVersion
