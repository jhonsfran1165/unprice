"use client"

import { use } from "react"
import { useParams, useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import type { TransferToWorkspace } from "@builderai/db/schema"
import { transferToWorkspaceSchema } from "@builderai/db/schema"
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
import type { RouterOutputs } from "~/trpc/client"
import { api } from "~/trpc/client"

export function TransferProjectToOrganization(props: {
  orgsPromise: Promise<RouterOutputs["auth"]["listOrganizations"]>
}) {
  const { workspaceSlug, projectSlug } = useParams() as {
    workspaceSlug: string
    projectSlug: string
  }
  const orgs = use(props.orgsPromise)

  const toaster = useToast()
  const router = useRouter()

  const form = useZodForm({
    schema: transferToWorkspaceSchema,
    defaultValues: {
      projectSlug,
    },
  })

  async function onSubmit(data: TransferToWorkspace) {
    try {
      if (!projectSlug) throw new Error("No project ID")

      await api.project.transferToWorkspace.mutate(data)
      toaster.toast({ title: "Project transferred" })
      router.refresh()
      router.push(`/${workspaceSlug}`)
    } catch (err) {
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
    }
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
