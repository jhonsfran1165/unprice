"use client"

import { useParams, useRouter } from "next/navigation"
import { useTransition } from "react"

import { type Project, type ProjectInsert, projectInsertBaseSchema } from "@builderai/db/validators"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Input } from "@builderai/ui/input"

import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

const CreateProjectForm = (props: {
  onSuccess?: (project: Project) => void
  defaultValues?: Project
}) => {
  const router = useRouter()
  const workspaceSlug = useParams().workspaceSlug as string

  const [_isPending, startTransition] = useTransition()

  const form = useZodForm({
    schema: projectInsertBaseSchema,
    defaultValues: props.defaultValues,
  })

  const createProject = api.projects.create.useMutation({
    onSettled: async () => {
      router.refresh()
    },
    onSuccess: (data) => {
      const { project: newProject } = data
      if (props.onSuccess) {
        props.onSuccess(newProject)
      } else {
        router.push(`/${workspaceSlug}/${newProject?.slug}`)
      }

      toastAction("success")
    },
  })

  const onSubmit = (data: ProjectInsert) => {
    startTransition(() => {
      createProject.mutate(data)
    })
  }

  return (
    <Form {...form}>
      <form
        id="add-org-form"
        onSubmit={async (e) => {
          await form.handleSubmit(onSubmit)(e)
        }}
        className="space-y-6"
      >
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="builderai" />
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
                  <Input {...field} placeholder="https://builderai.com" />
                </FormControl>
                <FormDescription>The URL of your app</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <SubmitButton
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
