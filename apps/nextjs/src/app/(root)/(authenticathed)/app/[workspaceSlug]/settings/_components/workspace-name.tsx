"use client"

import { use } from "react"
import { useRouter } from "next/navigation"

import type { RouterOutputs } from "@builderai/api"
import type { RenameWorkspace } from "@builderai/db/validators"
import { renameWorkspaceSchema } from "@builderai/db/validators"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import {
  Form,
  FormControl,
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

export function WorkspaceName(props: {
  workspacePromise: Promise<RouterOutputs["workspaces"]["getBySlug"]>
  workspaceSlug: string
}) {
  const router = useRouter()
  const apiUtils = api.useUtils()
  const { workspace } = use(props.workspacePromise)

  const form = useZodForm({
    schema: renameWorkspaceSchema,
    defaultValues: {
      name: workspace?.name ?? "",
      slug: props.workspaceSlug,
    },
  })

  const renamedWorkspace = api.workspaces.renameWorkspace.useMutation({
    onSettled: async () => {
      await apiUtils.workspaces.listWorkspaces.invalidate()
      router.refresh()
    },
    onSuccess: () => {
      toastAction("success")
    },
  })

  async function onSubmit(data: RenameWorkspace) {
    await renamedWorkspace.mutateAsync(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Name</CardTitle>
        <CardDescription>Change the name of your workspace</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form
          className="flex flex-col space-y-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <CardContent>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="builderai" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <SubmitButton
              isDisabled={form.formState.isSubmitting}
              isSubmitting={form.formState.isSubmitting}
              label="Save"
            />
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
