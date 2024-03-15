"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"

import type { RouterOutputs } from "@builderai/api"

import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"

const CreateNewVersion = ({
  projectSlug,
  workspaceSlug,
  plan,
}: {
  projectSlug: string
  workspaceSlug: string
  plan: RouterOutputs["plans"]["getBySlug"]["plan"]
}) => {
  const router = useRouter()

  const createNewVersion = api.plans.createNewVersion.useMutation({
    onSuccess: (data) => {
      const { planVersion } = data
      toastAction("success")
      router.push(
        `/${workspaceSlug}/${projectSlug}/plans/${plan?.slug}/${planVersion?.version}/overview`
      )
    },
  })

  function onCreateVersion() {
    startTransition(() => {
      if (plan?.id === undefined) {
        toastAction("error", "Plan id is undefined")
        return
      }

      void createNewVersion.mutateAsync({
        planId: plan.id,
      })
    })
  }

  return (
    <div className="sm:col-span-full">
      <SubmitButton
        isSubmitting={createNewVersion.isPending}
        isDisabled={createNewVersion.isPending}
        label={"Create new version"}
        onClick={onCreateVersion}
      />
    </div>
  )
}

export default CreateNewVersion
