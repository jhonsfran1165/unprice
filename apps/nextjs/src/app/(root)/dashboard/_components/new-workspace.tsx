"use client"

import { type WorkspaceInsert, workspaceInsertBase } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@unprice/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export default function NewTeamDialog(props: { closeDialog: () => void; isOpen: boolean }) {
  const _versions = api.planVersions.listByActiveProject.useQuery(
    {
      published: true,
      active: true,
      enterprisePlan: true,
    },
    {
      refetchOnWindowFocus: false,
      enabled: props.isOpen, // only fetch plans when dialog is open
    }
  )

  // TODO: plans should be fetch from the plan versions endpoint
  const form = useZodForm({
    schema: workspaceInsertBase,
    defaultValues: {
      name: "",
    },
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create new team</DialogTitle>
        <DialogDescription>
          Add a new workspace to invite other people to collaborate.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data: WorkspaceInsert) => {
            console.log(data)
          })}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Acme Inc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => props.closeDialog()}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}
