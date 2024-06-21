"use client"

import { useRouter } from "next/navigation"
import { use } from "react"

import type { RouterOutputs } from "@builderai/api"
import type { ProjectTransferToWorkspace } from "@builderai/db/validators"
import { transferToWorkspaceSchema } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@builderai/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@builderai/ui/form"
import { LoadingAnimation } from "@builderai/ui/loading-animation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@builderai/ui/select"

import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function TransferProjectToTeam({
  workspacesPromise,
  projectSlug,
  workspaceSlug,
}: {
  projectSlug: string
  workspaceSlug: string
  workspacesPromise: Promise<RouterOutputs["workspaces"]["listWorkspaces"]>
}) {
  const { workspaces } = use(workspacesPromise)
  const router = useRouter()
  const apiUtils = api.useUtils()

  const form = useZodForm({
    schema: transferToWorkspaceSchema,
    defaultValues: {
      projectSlug,
    },
  })

  const transferToWorkspace = api.projects.transferToWorkspace.useMutation({
    onSettled: async () => {
      await apiUtils.projects.listByWorkspace.refetch()
      router.refresh()
    },
    onSuccess: (data) => {
      toastAction("success")
      // redirect to the new workspace
      router.push(`/${data?.workspaceSlug}`)
    },
  })

  async function onSubmit(data: ProjectTransferToWorkspace) {
    await transferToWorkspace.mutateAsync(data)
  }

  const title = "Transfer to Team"
  const description = "Transfer this project to a team workspace"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex items-center">{description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">{title}</Button>
          </DialogTrigger>
          <DialogContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <FormField
                  control={form.control}
                  name="targetWorkspaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workspaces
                            .filter((wk) => wk.slug !== workspaceSlug)
                            .map((wk) => (
                              <SelectItem key={wk.id} value={wk.id}>
                                {wk.name ?? wk.slug}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {`I'm sure. Transfer this project`}
                    {form.formState.isSubmitting && <LoadingAnimation />}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
