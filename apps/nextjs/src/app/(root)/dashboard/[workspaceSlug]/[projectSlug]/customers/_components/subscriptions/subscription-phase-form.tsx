"use client"

import {
  type InsertSubscriptionPhase,
  type SubscriptionPhase,
  subscriptionPhaseInsertSchema,
  subscriptionPhaseSelectSchema,
} from "@unprice/db/validators"
import { Form } from "@unprice/ui/form"
import { Separator } from "@unprice/ui/separator"
import { useEffect } from "react"
import { z } from "zod"
import CollectionMethodFormField from "~/components/forms/collection-method-field"
import ConfigItemsFormField from "~/components/forms/items-fields"
import PaymentMethodsFormField from "~/components/forms/payment-method-field"
import SelectPlanFormField from "~/components/forms/select-plan-field"
import StartCycleFormField from "~/components/forms/start-cycle-field"
import TrialDaysFormField from "~/components/forms/trial-days-field"
import WhenToBillFormField from "~/components/forms/when-to-bill-field"
import { SubmitButton } from "~/components/submit-button"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"
import DurationFormField from "./duration-field"

export function SubscriptionPhaseForm({
  setDialogOpen,
  defaultValues,
  onSubmit,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertSubscriptionPhase | SubscriptionPhase
  onSubmit: (data: InsertSubscriptionPhase | SubscriptionPhase) => void
}) {
  const editMode = defaultValues.id !== "" && defaultValues.id !== undefined

  const formSchema = editMode
    ? subscriptionPhaseSelectSchema
    : subscriptionPhaseInsertSchema.superRefine((data, ctx) => {
        if (data.paymentMethodRequired) {
          if (!data.paymentMethodId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Payment method is required for this phase",
              path: ["paymentMethodId"],
            })
          }
        }
      })

  const form = useZodForm({
    schema: formSchema,
    defaultValues,
  })

  const createPhase = api.subscriptions.createPhase.useMutation()
  const updatePhase = api.subscriptions.updatePhase.useMutation()

  const onSubmitForm = async (data: InsertSubscriptionPhase | SubscriptionPhase) => {
    if (editMode) {
      const { phase } = await updatePhase.mutateAsync({
        ...data,
        id: defaultValues.id!,
      } as SubscriptionPhase)

      onSubmit(phase)
      setDialogOpen?.(false)
    } else {
      const { phase } = await createPhase.mutateAsync(data as InsertSubscriptionPhase)

      onSubmit(phase)
      setDialogOpen?.(false)
    }
  }

  // all this querues are deduplicated inside each form field
  const { data: planVersions, isLoading } = api.planVersions.listByActiveProject.useQuery({
    enterprisePlan: true,
    published: true,
  })

  const selectedPlanVersionId = form.watch("planVersionId")
  const selectedPlanVersion = planVersions?.planVersions.find(
    (version) => version.id === selectedPlanVersionId
  )

  useEffect(() => {
    if (selectedPlanVersion) {
      form.setValue("whenToBill", selectedPlanVersion.whenToBill)
      form.setValue("paymentMethodRequired", selectedPlanVersion.paymentMethodRequired)
      form.setValue("collectionMethod", selectedPlanVersion.collectionMethod)
      form.setValue("whenToBill", selectedPlanVersion.whenToBill)
      form.setValue("trialDays", selectedPlanVersion.trialDays)
    }
  }, [selectedPlanVersion?.id])

  return (
    <Form {...form}>
      <form className="space-y-6">
        <SelectPlanFormField
          form={form}
          isDisabled={editMode}
          planVersions={planVersions?.planVersions ?? []}
          isLoading={isLoading}
        />

        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
          <CollectionMethodFormField form={form} isDisabled={editMode} />
          <TrialDaysFormField form={form} isDisabled={editMode} />
        </div>

        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
          <StartCycleFormField
            form={form}
            billingPeriod={selectedPlanVersion?.billingPeriod}
            isDisabled={editMode}
          />
          <WhenToBillFormField form={form} isDisabled={editMode} />
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          <DurationFormField form={form} startDisabled={editMode} />
        </div>

        <PaymentMethodsFormField
          form={form}
          withSeparator
          paymentProvider={selectedPlanVersion?.paymentProvider}
          paymentProviderRequired={selectedPlanVersion?.paymentMethodRequired}
        />

        <ConfigItemsFormField
          form={form}
          withSeparator
          isDisabled={editMode}
          planVersions={planVersions?.planVersions ?? []}
          isLoading={isLoading}
        />

        <div className="mt-8 flex justify-end space-x-4">
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
