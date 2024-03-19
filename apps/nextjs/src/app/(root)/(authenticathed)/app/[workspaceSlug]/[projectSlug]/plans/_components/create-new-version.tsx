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

  const createVersion = api.plans.createVersion.useMutation({
    onSuccess: (data) => {
      const { planVersion } = data
      toastAction("success")
      router.push(
        `/${workspaceSlug}/${projectSlug}/plans/${plan?.slug}/${planVersion?.version}`
      )
    },
  })

  function onCreateVersion() {
    startTransition(() => {
      if (plan?.id === undefined) {
        toastAction("error", "Plan id is undefined")
        return
      }

      void createVersion.mutateAsync({
        planId: plan.id,
      })
    })
  }

  return (
    <div className="sm:col-span-full">
      <SubmitButton
        isSubmitting={createVersion.isPending}
        isDisabled={createVersion.isPending}
        label={"Save version"}
        onClick={onCreateVersion}
      />
    </div>
  )
}

export default CreateNewVersion
