"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import type { CreateProject } from "@builderai/db/schema/project"
import { createProjectSchema } from "@builderai/db/schema/project"
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

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export const CreateProjectForm = (props: {
  workspaceSlug: string
  // defaults to redirecting to the project page
  onSuccess?: (project: CreateProject & { slug: string }) => void
}) => {
  const router = useRouter()
  const toaster = useToast()
  const [isPending, startTransition] = useTransition()

  const form = useZodForm({
    schema: createProjectSchema,
    defaultValues: {
      name: "sample project",
      url: "https://example.com",
    },
  })

  const onSubmit = (data: CreateProject) => {
    startTransition(async () => {
      try {
        const { projectSlug } = await api.project.create.mutate(data)
        if (props.onSuccess) {
          props.onSuccess({
            ...data,
            slug: projectSlug,
          })
        } else {
          router.push(`/${props.workspaceSlug}/${projectSlug}/overview`)
        }
        toaster.toast({
          title: "Project created",
          description: `Project ${data.name} created successfully.`,
        })
      } catch (err) {
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
      }
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
                <Input {...field} placeholder="Acme Corp" />
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
                <Input {...field} placeholder="https://acme-corp.com" />
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
            {/* {!isPending ? "Confirm" : <LoadingAnimation />} */}
            {!isPending ? "Create Project" : "Loading..."}
          </Button>
        </div>
      </form>
    </Form>
  )
}
