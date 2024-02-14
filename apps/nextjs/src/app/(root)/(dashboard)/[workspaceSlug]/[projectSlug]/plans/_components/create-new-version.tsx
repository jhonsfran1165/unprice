"use client"

import { useParams, useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import { Add } from "@builderai/ui/icons"
import { useToast } from "@builderai/ui/use-toast"
import type { CreatePlanVersion } from "@builderai/validators/price"
import { createNewVersionPlan } from "@builderai/validators/price"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

// TODO: we can do the same without zod-form
const CreateNewVersion = (props: {
  projectSlug: string
  plan: RouterOutputs["plans"]["getBySlug"]["plan"]
}) => {
  const params = useParams()
  const router = useRouter()

  const workspaceSlug = params.workspaceSlug as string
  const toaster = useToast()
  const apiUtils = api.useUtils()

  const form = useZodForm({
    schema: createNewVersionPlan,
    defaultValues: { planId: props.plan.id, projectSlug: props.projectSlug },
  })

  const createPlanVersion = api.plans.createNewVersion.useMutation({
    onSettled: async () => {
      await apiUtils.plans.listByProject.invalidate({
        projectSlug: props.projectSlug,
      })
    },
    onSuccess: (data) => {
      const { planVersion } = data
      toaster.toast({
        title: "Project created",
        description: `Version ${planVersion?.version} created successfully.`,
      })

      router.push(
        `/${workspaceSlug}/${props.projectSlug}/plans/${props.plan.slug}/${planVersion?.version}/overview`
      )
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Error creating project",
          variant: "destructive",
          description:
            "An issue occurred while creating your project. Please try again.",
        })
      }
    },
  })

  const onSubmit = async (data: CreatePlanVersion) => {
    await createPlanVersion.mutateAsync(data)
  }

  return (
    <div className="sm:col-span-full">
      <Button
        title="Submit"
        className="w-full sm:w-auto"
        onClick={form.handleSubmit(onSubmit)}
        disabled={form.formState.isSubmitting}
      >
        <Add className="mr-2 h-4 w-4" />
        {form.formState.isSubmitting && (
          <div className="mr-2" role="status">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          </div>
        )}
        {"Create New Version"}
      </Button>
    </div>
  )
}

export default CreateNewVersion
