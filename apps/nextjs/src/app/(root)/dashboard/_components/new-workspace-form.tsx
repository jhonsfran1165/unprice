"use client"

import { APP_DOMAIN } from "@unprice/config"
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
import { useRouter } from "next/navigation"
import { updateSession } from "~/actions/update-session"
import ConfigItemsFormField from "~/components/forms/items-fields"
import SelectPlanFormField from "~/components/forms/select-plan-field"
import { SubmitButton } from "~/components/submit-button"
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
    defaultValues: {
      ...defaultValues,
      successUrl: `${APP_DOMAIN}/new?customer_id={CUSTOMER_ID}`,
      cancelUrl: `${APP_DOMAIN}`,
      isPersonal: false,
      isInternal: false,
    },
  })

  const createWorkspace = api.workspaces.signUp.useMutation({
    onSuccess: async ({ workspace }) => {
      setDialogOpen?.(false)

      // invalidate the workspaces list to refresh the workspaces
      await apiUtils.workspaces.listWorkspacesByActiveUser.invalidate()

      // trigger the session update
      await updateSession()

      // redirect to the new workspace
      router.push(`/${workspace.slug}`)
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
              <FormLabel>Workspace name</FormLabel>
              <FormDescription>
                This is the name of the workspace that will be displayed in the UI.
              </FormDescription>
              <FormControl>
                <Input {...field} placeholder="Acme Inc." value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SelectPlanFormField form={form} />

        <ConfigItemsFormField form={form} withSeparator />

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
