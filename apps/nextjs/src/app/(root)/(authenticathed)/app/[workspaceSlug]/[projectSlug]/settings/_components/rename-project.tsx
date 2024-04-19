"use client"

import { use } from "react"
import { useRouter } from "next/navigation"

import type { RouterOutputs } from "@builderai/api"
import type { RenameProject } from "@builderai/db/validators"
import { renameProjectSchema } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import {
  Form,
  FormControl,
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

export function RenameProjectForm(props: {
  projectPromise: Promise<RouterOutputs["projects"]["getBySlug"]>
}) {
  const { project } = use(props.projectPromise)
  const apiUtils = api.useUtils()
  const router = useRouter()

  const renameProject = api.projects.rename.useMutation({
    onSettled: async () => {
      await apiUtils.projects.listByWorkspace.invalidate()
      await apiUtils.projects.getBySlug.invalidate({ slug: project.slug })
      router.refresh()
    },
    onSuccess: () => {
      toastAction("success")
    },
  })

  const form = useZodForm({
    schema: renameProjectSchema,
    defaultValues: {
      slug: project.slug,
      name: project.name,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data: RenameProject) => {
          renameProject.mutate(data)
        })}
        className="space-y-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="my-project" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex pt-4">
          <Button type="submit" className="ml-auto">
            Save
            {form.formState.isSubmitting && (
              <LoadingAnimation className="ml-2" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
