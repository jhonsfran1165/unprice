"use client"

import { useParams, useRouter } from "next/navigation"

import { type Project, type ProjectInsert, projectInsertBaseSchema } from "@unprice/db/validators"
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

import { CURRENCIES } from "@unprice/db/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import TimeZoneFormField from "~/components/forms/timezone-field"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

const CreateProjectForm = (props: {
  onSuccess?: (project: Project) => void
  defaultValues?: ProjectInsert
}) => {
  const router = useRouter()
  const workspaceSlug = useParams().workspaceSlug as string
  const apiUtils = api.useUtils()

  const form = useZodForm({
    schema: projectInsertBaseSchema,
    defaultValues: props.defaultValues,
  })

  const createProject = api.projects.create.useMutation({
    onSuccess: (data) => {
      const { project: newProject } = data

      toastAction("success")

      // invalidate the projects query
      apiUtils.projects.listByActiveWorkspace.invalidate()

      if (props.onSuccess) {
        props.onSuccess(newProject)
      } else {
        router.push(`/${workspaceSlug}/${newProject?.slug}`)
      }
    },
  })

  const onSubmit = async (data: ProjectInsert) => {
    await createProject.mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="unprice" />
                </FormControl>
                <FormDescription>A name to identify your app in the dashboard.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://unprice.dev" />
                </FormControl>
                <FormDescription>The URL of your app</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <FormLabel>Currency</FormLabel>

                <FormDescription>
                  This customer will use this currency for all its invoices.
                </FormDescription>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <TimeZoneFormField form={form} />
        </div>

        <div className="flex justify-end space-x-4 pt-8">
          <SubmitButton
            onClick={() => form.handleSubmit(onSubmit)()}
            isDisabled={form.formState.isSubmitting}
            isSubmitting={form.formState.isSubmitting}
            label="Create Project"
          />
        </div>
      </form>
    </Form>
  )
}

export default CreateProjectForm
