"use client"

import { useRouter } from "next/navigation"
import { use } from "react"

import type { RenameProject } from "@unprice/db/validators"
import { renameProjectSchema } from "@unprice/db/validators"
import type { RouterOutputs } from "@unprice/trpc/routes"
import { Button } from "@unprice/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { startTransition } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@unprice/ui/card"
import { toast, toastAction } from "~/lib/toast"
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

  const migrateProject = api.analytics.migrate.useMutation({
    onSuccess: () => {
      router.refresh()
    },
  })

  function onMigrateProject() {
    startTransition(() => {
      toast.promise(migrateProject.mutateAsync(), {
        loading: "Publishing...",
        success: "Version published",
      })
    })
  }

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
        onSubmit={form.handleSubmit(async (data: RenameProject) => {
          await renameProject.mutateAsync(data)
        })}
        className="space-y-2"
      >
        <Card>
          <CardHeader>
            <CardTitle>Project name</CardTitle>
            <CardDescription>Change the display name of your project</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>

          <CardFooter className="flex justify-between gap-2 border-t px-6 py-4">
            <Button type="submit">
              Save
              {form.formState.isSubmitting && <LoadingAnimation className="ml-2" />}
            </Button>
            <Button type="button" variant="ghost" onClick={onMigrateProject}>
              Migrate analytics data
              {migrateProject.isPending && <LoadingAnimation className="ml-2" />}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
