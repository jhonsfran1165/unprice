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

// TODO: fix thi, should handle planversion form and update action
const CreateNewVersion = ({
  projectSlug,
  workspaceSlug,
  planVersion,
}: {
  projectSlug: string
  workspaceSlug: string
  planVersion?: RouterOutputs["planVersions"]["getByVersion"]["planVersion"]
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

  const createVersion = api.planVersions.create.useMutation({
    onSuccess: (data) => {
      const { planVersion: version } = data
      toastAction("success")

      router.refresh()
      router.push(
        `/${workspaceSlug}/${projectSlug}/plans/${planVersion?.plan.slug}/${version.version}`
      )
    },
  })

  const updateVersion = api.planVersions.update.useMutation({
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

      if (!planVersion) {
        return
      }

      void updateVersion.mutateAsync({
        ...planVersion,
        // TODO: pass version id - pass planversion object
        id: "planVersionId",
        projectId: planVersion?.projectId,
        title: "Version 1",
        description: "Version 1",
        billingPeriod: "month",
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

      if (!planVersion) {
        return
      }

      void createVersion.mutateAsync({
        planId: planVersion.plan.id,
        featuresConfig: planFeatures.planFeatures,
        projectId: planVersion.projectId,
        currency: "EUR",
        title: "Version 1",
        description: "Version 1",
        billingPeriod: "month",
      })
    })
  }

  return (
    <div className="button-primary flex items-center space-x-1 rounded-md ">
      <div className="sm:col-span-full">
        <SubmitButton
          variant={"custom"}
          isSubmitting={
            planVersion?.id ? updateVersion.isPending : createVersion.isPending
          }
          isDisabled={
            planVersion?.id ? updateVersion.isPending : createVersion.isPending
          }
          label={planVersion?.version ? "Update version" : "Save version"}
          onClick={planVersion?.version ? onUpdateVersion : onCreateVersion}
        />
      </div>

      <Separator orientation="vertical" className="h-[20px] p-0" />

      <VersionActions
        planVersion={
          planVersion ?? {
            id: "planVersionId",
            planId: "planId",
            projectId: "projectId",
            version: "version",
            currency: "USD",
          }
        }
      />
    </div>
  )
}

export default CreateNewVersion
