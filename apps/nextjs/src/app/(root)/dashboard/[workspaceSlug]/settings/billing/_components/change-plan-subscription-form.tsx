"use client"
import { type SubscriptionChangePlan, subscriptionChangePlanSchema } from "@unprice/db/validators"
import { Form } from "@unprice/ui/form"
import { useRouter } from "next/navigation"
import ConfigUnpriceItemsFormField from "~/components/forms/items-unprice-fields"
import SelectUnpricePlanFormField from "~/components/forms/select-unprice-plan-field"
import { SubmitButton } from "~/components/submit-button"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export const ChangePlanSubscriptionForm = ({
  setDialogOpen,
  defaultValues,
}: {
  defaultValues: SubscriptionChangePlan
  setDialogOpen?: (open: boolean) => void
}) => {
  const router = useRouter()

  const form = useZodForm({
    schema: subscriptionChangePlanSchema,
    defaultValues,
  })

  const changePlanSubscription = api.subscriptions.changePlan.useMutation({
    onSuccess: () => {
      setDialogOpen?.(false)

      router.refresh()
    },
  })

  const onSubmitForm = async (data: SubscriptionChangePlan) => {
    await changePlanSubscription.mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
        <SelectUnpricePlanFormField form={form} isNextPlanVersionId />

        <ConfigUnpriceItemsFormField form={form} withSeparator isChangePlanSubscription />

        <div className="mt-8 flex justify-end space-x-4">
          <SubmitButton
            onClick={() => form.handleSubmit(onSubmitForm)()}
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label="Upgrade"
          />
        </div>
      </form>
    </Form>
  )
}
