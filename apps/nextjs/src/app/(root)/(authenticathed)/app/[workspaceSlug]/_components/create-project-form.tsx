"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import type { Project, ProjectInsert } from "@builderai/db/validators"
import { createProjectSchema } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
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
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

const CreateProjectForm = (props: {
  workspaceSlug: string
  onSuccess?: (project: Project) => void
}) => {
  const router = useRouter()

  const apiUtils = api.useUtils()
  const [isPending, startTransition] = useTransition()

  const form = useZodForm({
    schema: createProjectSchema,
    defaultValues: {
      name: "",
      url: "",
    },
  })

  const createProject = api.projects.create.useMutation({
    onSettled: async () => {
      await apiUtils.projects.listByWorkspace.invalidate()
    },
    onSuccess: (data) => {
      const { project: newProject } = data
      if (props.onSuccess) {
        props.onSuccess(newProject)
      } else {
        router.push(`/${props.workspaceSlug}/${newProject?.slug}/overview`)
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
          e.preventDefault()
          await form.handleSubmit(onSubmit)(e)
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="builderai" />
              </FormControl>
              <FormDescription>
                A name to identify your app in the dashboard.
              </FormDescription>
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

        <div className="sm:col-span-full">
          <Button
            form="add-org-form"
            title="Submit"
            type="submit"
            className="w-full sm:w-auto"
            disabled={form.formState.isSubmitting || isPending}
          >
            {`Create Project`}
            {form.formState.isSubmitting ||
              (isPending && (
                <LoadingAnimation variant={"destructive"} className="ml-2" />
              ))}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CreateProjectForm
