"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

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
import { useToast } from "@builderai/ui/use-toast"
import type { CreateProject } from "@builderai/validators/project"
import { createProjectSchema } from "@builderai/validators/project"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

const CreateProjectForm = (props: {
  workspaceSlug: string
  // defaults to redirecting to the project page
  onSuccess?: (project: CreateProject & { slug: string }) => void
}) => {
  const router = useRouter()
  const toaster = useToast()
  const apiUtils = api.useUtils()
  const [isPending, startTransition] = useTransition()

  const form = useZodForm({
    schema: createProjectSchema,
  })

  const createProject = api.project.create.useMutation({
    onSettled: async () => {
      await apiUtils.project.listByActiveWorkspace.invalidate()
    },
    onSuccess: (data) => {
      if (props.onSuccess) {
        props.onSuccess({
          ...data,
          slug: data.projectSlug,
        })
      } else {
        router.push(`/${props.workspaceSlug}/${data.projectSlug}/overview`)
      }

      toaster.toast({
        title: "Project created",
        description: `Project ${data.name} created successfully.`,
      })
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Error creating project",
          variant: "destructive",
          description:
            "An issue occurred while creating your project. Please try again.",
        })
      }
    },
  })

  const onSubmit = (data: CreateProject) => {
    startTransition(async () => {
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

        {/* <Button type="submit">Create Project</Button> */}

        <div className="sm:col-span-full">
          <Button
            form="add-org-form"
            title="Submit"
            type="submit"
            className="w-full sm:w-auto"
          >
            {/* // TODO: improve this adding a loading animation */}
            {/* {!isPending ? "Confirm" : <LoadingAnimation />} */}
            {!isPending ? "Create Project" : "Loading..."}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CreateProjectForm
