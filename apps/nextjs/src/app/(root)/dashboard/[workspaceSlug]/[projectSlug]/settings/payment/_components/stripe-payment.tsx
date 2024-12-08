"use client"

import { useRouter } from "next/navigation"
import { use, useState } from "react"

import type { RouterOutputs } from "@unprice/api"
import type { RenameProject } from "@unprice/db/validators"
import { renameProjectSchema } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { LoadingAnimation } from "@unprice/ui/loading-animation"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@unprice/ui/card"
import { Switch } from "@unprice/ui/switch"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function StripePayment(props: {
  projectPromise: Promise<RouterOutputs["projects"]["getBySlug"]>
}) {
  const { project } = use(props.projectPromise)
  const apiUtils = api.useUtils()
  const router = useRouter()
  const [active, setActive] = useState(false)

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
        onSubmit={form.handleSubmit(async (data: RenameProject) => {
          await renameProject.mutateAsync(data)
        })}
        className="space-y-2"
      >
        <Card>
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col space-y-1.5">
                <CardTitle>Stripe configuration</CardTitle>
                <CardDescription>
                  Configure the API key for connection to your stripe account
                </CardDescription>
              </div>
              <div className="flex flex-col items-end">
                <FormControl>
                  <Switch
                    checked={active}
                    onCheckedChange={setActive}
                  />
                </FormControl>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="apikey"
              disabled={!active}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Api Key</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="my-project" disabled={!active} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={!active}>
              Save
              {form.formState.isSubmitting && <LoadingAnimation className="ml-2" />}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
