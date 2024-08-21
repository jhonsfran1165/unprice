"use client"
import type { InsertPlanVersion } from "@unprice/db/validators"
import { planVersionSelectBaseSchema, versionInsertBaseSchema } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Form } from "@unprice/ui/form"
import { usePathname, useRouter } from "next/navigation"
import { startTransition } from "react"
import type { z } from "zod"
import { ConfirmAction } from "~/components/confirm-action"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"
import { BannerPublishedVersion } from "../[planVersionId]/_components/banner"
import {
  BillingPeriodFormField,
  CollectionMethodFormField,
  CurrencyFormField,
  DescriptionFormField,
  PaymentMethodRequiredFormField,
  PaymentProviderFormField,
  PlanTypeFormField,
  StartCycleFormField,
  TitleFormField,
  WhenToBillFormField,
} from "./version-fields-form"

const isPublishedSchema = planVersionSelectBaseSchema.partial().required({
  id: true,
  projectId: true,
})

export type PublishedPlanVersion = z.infer<typeof isPublishedSchema>

export function PlanVersionForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertPlanVersion
}) {
  const pathname = usePathname()
  const router = useRouter()
  const editMode = !!defaultValues.id
  const isPublished = defaultValues.status === "published"

  const form = useZodForm({
    schema: isPublished ? isPublishedSchema : versionInsertBaseSchema,
    defaultValues,
  })

  const createPlanVersion = api.planVersions.create.useMutation({
    onSuccess: ({ planVersion }) => {
      form.reset(planVersion)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const updatePlanVersion = api.planVersions.update.useMutation({
    onSuccess: ({ planVersion }) => {
      form.reset(planVersion)
      toastAction("updated")
      setDialogOpen?.(false)

      // Only needed when the form is inside a uncontrolled dialog - normally updates
      // FIXME: hack to close the dialog when the form is inside a uncontrolled dialog
      if (!setDialogOpen) {
        const escKeyEvent = new KeyboardEvent("keydown", {
          key: "Escape",
        })
        document.dispatchEvent(escKeyEvent)
      }

      router.refresh()
    },
  })

  const deletePlanVersion = api.planVersions.remove.useMutation({
    onSuccess: ({ planVersion }) => {
      toastAction("deleted")
      setDialogOpen?.(false)
      form.reset()

      if (pathname.includes(planVersion.id)) {
        router.push(pathname.replace(planVersion.id, ""))
      }

      router.refresh()
    },
  })

  const onSubmitForm = async (data: InsertPlanVersion | PublishedPlanVersion) => {
    if (!defaultValues.id && !isPublished) {
      await createPlanVersion.mutateAsync(data as InsertPlanVersion)
    }

    if (defaultValues.id && defaultValues.projectId) {
      await updatePlanVersion.mutateAsync({
        ...data,
        id: defaultValues.id,
      })
    }
  }

  function onDelete() {
    startTransition(() => {
      if (!defaultValues.id) {
        toastAction("error", "no data defined")
        return
      }

      void deletePlanVersion.mutateAsync({ id: defaultValues.id })
    })
  }

  const planType = form.watch("planType")

  return (
    <Form {...form}>
      <form className="space-y-6">
        {isPublished && <BannerPublishedVersion />}

        <PaymentMethodRequiredFormField form={form} isDisabled={isPublished} />

        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:space-y-4">
          <TitleFormField form={form} isDisabled={isPublished} />

          <CurrencyFormField form={form} isDisabled={isPublished} />

          <PlanTypeFormField form={form} isDisabled={isPublished} />

          {planType === "recurring" && (
            <BillingPeriodFormField form={form} isDisabled={isPublished} />
          )}

          <CollectionMethodFormField form={form} isDisabled={isPublished} />

          <StartCycleFormField form={form} isDisabled={isPublished} />

          <WhenToBillFormField form={form} isDisabled={isPublished} />

          <DescriptionFormField form={form} isDisabled={isPublished} />

          <PaymentProviderFormField form={form} isDisabled={isPublished} />
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          {editMode && (
            <ConfirmAction
              confirmAction={() => {
                setDialogOpen?.(false)

                // Only needed when the form is inside a uncontrolled dialog - normally updates
                // FIXME: hack to close the dialog when the form is inside a uncontrolled dialog
                if (!setDialogOpen) {
                  const escKeyEvent = new KeyboardEvent("keydown", {
                    key: "Escape",
                  })
                  document.dispatchEvent(escKeyEvent)
                }

                onDelete()
              }}
            >
              <Button variant={"link"} disabled={deletePlanVersion.isPending}>
                Delete
              </Button>
            </ConfirmAction>
          )}

          <SubmitButton
            onClick={() => form.handleSubmit(onSubmitForm)()}
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label={editMode ? "Update" : "Create"}
          />
        </div>
      </form>
    </Form>
  )
}
