"use client"

import { useParams, useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import type { TransferToWorkspace } from "@builderai/db/schema/project"
import { transferToWorkspaceSchema } from "@builderai/db/schema/project"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function TransferProjectToOrganization() {
  const params = useParams()

  const [orgs] = api.auth.listOrganizations.useSuspenseQuery()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string

  const toaster = useToast()
  const router = useRouter()
  const apiUtils = api.useUtils()

  const form = useZodForm({
    schema: transferToWorkspaceSchema,
    defaultValues: {
      projectSlug,
    },
  })

  const transferToWorkspace = api.project.transferToWorkspace.useMutation({
    onSettled: async () => {
      await apiUtils.project.listByActiveWorkspace.refetch()
      router.push(`/${workspaceSlug}`)
    },
    onSuccess: () => {
      toaster.toast({
        title: "Project transferred",
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
          title: "Project could not be transferred",
          variant: "destructive",
        })
      }
    },
  })

  async function onSubmit(data: TransferToWorkspace) {
    if (!projectSlug) throw new Error("No project ID provided")
    transferToWorkspace.mutate(data)
  }

  const title = "Transfer to Organization"
  const description = "Transfer this project to an organization"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex items-center">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">{title}</Button>
          </DialogTrigger>
          <DialogContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orgs
                            .filter((org) => org.slug !== workspaceSlug)
                            .map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
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
                  <Button variant="destructive" type="submit">
                    {`I'm sure. Transfer this project`}
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
