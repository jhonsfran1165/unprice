"use client"
import type { InsertSubscription, Subscription, SubscriptionItem } from "@unprice/db/validators"
import { subscriptionInsertSchema } from "@unprice/db/validators"
import { Form } from "@unprice/ui/form"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import type { z } from "zod"
import TimeZoneFormField from "~/components/forms/timezone-field"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"
import CustomerFormField from "./customer-field"
import SubscriptionPhaseFormField from "./subscription-phase-field"

export function SubscriptionForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues:
    | (InsertSubscription & { items?: SubscriptionItem[] })
    | (Subscription & { items?: SubscriptionItem[] })
}) {
  const router = useRouter()
  const isEdit = !!defaultValues.id
  const { workspaceSlug, projectSlug } = useParams()

  const createSubscription = api.subscriptions.create.useMutation({
    onSuccess: ({ subscription }) => {
      form.reset(subscription)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  // customer lists
  const { data: customers } = api.customers.listByActiveProject.useQuery(
    {
      search: null,
      from: null,
      to: null,
      page: 1,
      page_size: 100,
    },
    {
      enabled: defaultValues.customerId === "",
    }
  )

  const formSchema = subscriptionInsertSchema

  const form = useZodForm({
    schema: formSchema,
    defaultValues: defaultValues,
  })

  const customerId = form.watch("customerId")
  const selectedCustomer = customers?.customers.find((customer) => customer.id === customerId)

  // keep in sync with the customer timezone
  useEffect(() => {
    if (selectedCustomer?.timezone) {
      form.setValue("timezone", selectedCustomer.timezone)
    }
  }, [selectedCustomer?.id])

  const onSubmitForm = async (data: z.infer<typeof formSchema>) => {
    if (!defaultValues.id) {
      await createSubscription.mutateAsync(data as InsertSubscription)
    }

    setDialogOpen?.(false)
    router.refresh()
    router.push(`/dashboard/${workspaceSlug}/${projectSlug}/customers/subscriptions/${data.id}`)
  }

  return (
    <Form {...form}>
      <form
        id={"subscription-form"}
        onSubmit={form.handleSubmit(onSubmitForm)}
        className="space-y-6"
      >
        <div className="space-y-8">
          <CustomerFormField form={form} isDisabled={isEdit} />

          <TimeZoneFormField form={form} isDisabled={isEdit} />

          <SubscriptionPhaseFormField form={form} />
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <SubmitButton
            form="subscription-form"
            onClick={() => form.handleSubmit(onSubmitForm)()}
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label={isEdit ? "Update Subscription" : "Create Subscription"}
          />
        </div>
      </form>
    </Form>
  )
}
