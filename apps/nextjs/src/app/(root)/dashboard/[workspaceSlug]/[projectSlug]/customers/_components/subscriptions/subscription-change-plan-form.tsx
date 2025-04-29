"use client"

import { type SubscriptionChangePlan, subscriptionChangePlanSchema } from "@unprice/db/validators"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { useRouter } from "next/navigation"
import ConfigItemsFormField from "~/components/forms/items-fields"
import SelectPlanFormField from "~/components/forms/select-plan-field"
import { SubmitButton } from "~/components/submit-button"
import { formatDate } from "~/lib/dates"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export default function SubscriptionChangePlanForm({
  setDialogOpen,
  defaultValues,
}: {
  defaultValues: SubscriptionChangePlan
  setDialogOpen?: (open: boolean) => void
}) {
  const router = useRouter()

  const form = useZodForm({
    schema: subscriptionChangePlanSchema,
    defaultValues,
  })

  const { data, isLoading } = api.planVersions.listByActiveProject.useQuery(
    {
      onlyPublished: true,
      onlyLatest: true,
    },
    {
      enabled: true,
    }
  )

  const changePhasePlan = api.subscriptions.changePhasePlan.useMutation({
    onSuccess: async () => {
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const onSubmitForm = async (data: SubscriptionChangePlan) => {
    await changePhasePlan.mutateAsync(data)
  }

  const planVersions =
    data?.planVersions.filter((plan) => plan.id !== defaultValues.currentPlanVersionId) ?? []

  return (
    <Form {...form}>
      <form className="space-y-6">
        <SelectPlanFormField
          form={form}
          // filter out the current plan version
          planVersions={planVersions}
          isLoading={isLoading}
        />

        <FormField
          control={form.control}
          name={"whenToChange"}
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <FormLabel>When to change</FormLabel>
              <FormDescription>When this subscription will be changed.</FormDescription>
              <Select onValueChange={field.onChange} value={field.value ?? "end_of_cycle"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select when to bill" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[
                    {
                      key: "end_of_cycle",
                      value: "End of cycle",
                      label: `End of cycle (${formatDate(
                        defaultValues.currentCycleEndAt ?? Date.now(),
                        defaultValues.timezone,
                        "MMM d, hh:mm"
                      )})`,
                    },
                    {
                      key: "immediately",
                      value: "Immediately",
                      label: `Immediately (${formatDate(
                        Date.now(),
                        defaultValues.timezone,
                        "MMM d, hh:mm"
                      )})`,
                    },
                  ].map((type) => (
                    <SelectItem key={type.key} value={type.key} description={type.label}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <ConfigItemsFormField
          form={form}
          withSeparator
          planVersions={planVersions}
          isLoading={isLoading}
        />

        <div className="mt-8 flex justify-end space-x-4">
          <SubmitButton
            onClick={() => form.handleSubmit(onSubmitForm)()}
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label="Change"
            withConfirmation
            confirmationMessage="Are you sure you want to change the plan? This action cannot be undone."
          />
        </div>
      </form>
    </Form>
  )
}
