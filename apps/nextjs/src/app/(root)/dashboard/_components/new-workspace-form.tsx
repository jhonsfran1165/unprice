"use client"

import { type WorkspaceSignup, workspaceSignupSchema } from "@unprice/db/validators"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { Separator } from "@unprice/ui/separator"
import { useRouter } from "next/navigation"
import ConfigItemsFormField from "~/components/forms/items-fields"
import PaymentMethodsFormField from "~/components/forms/payment-method-field"
import SelectPlanFormField from "~/components/forms/select-plan-field"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export default function NewWorkspaceForm({
  setDialogOpen,
  defaultValues,
}: {
  defaultValues: WorkspaceSignup
  setDialogOpen?: (open: boolean) => void
}) {
  const router = useRouter()
  const apiUtils = api.useUtils()

  const form = useZodForm({
    schema: workspaceSignupSchema,
    defaultValues: defaultValues,
  })

  const createWorkspace = api.workspaces.create.useMutation({
    onSettled: async () => {
      await apiUtils.workspaces.listWorkspacesByActiveUser.invalidate()
      router.refresh()
    },
    onSuccess: ({ workspace }) => {
      form.reset(workspace)
      toastAction("saved")
      setDialogOpen?.(false)
    },
  })

  const onSubmitForm = async (data: WorkspaceSignup) => {
    await createWorkspace.mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace name *</FormLabel>
              <FormDescription>
                This is the name of the workspace that will be displayed in the UI.
              </FormDescription>
              <FormControl>
                <Input {...field} placeholder="Acme Inc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SelectPlanFormField form={form} />

        <Separator className="my-8" />

        <PaymentMethodsFormField
          form={form}
          // TODO: sync this with the plan version
          paymentProvider={"stripe"}
        />

        <Separator className="my-8" />

        <ConfigItemsFormField form={form} />

        <div className="mt-8 flex justify-end space-x-4">
          <SubmitButton
            onClick={() => form.handleSubmit(onSubmitForm)()}
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label="Create"
          />
        </div>
      </form>
    </Form>
  )
}
