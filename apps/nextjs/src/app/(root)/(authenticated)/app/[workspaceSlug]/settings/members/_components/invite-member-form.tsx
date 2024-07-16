"use client"

import { useRouter } from "next/navigation"

import * as utils from "@builderai/db/utils"
import type { InviteMember } from "@builderai/db/validators"
import { inviteMembersSchema } from "@builderai/db/validators"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@builderai/ui/select"

import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export const InviteMemberForm = ({
  workspaceSlug,
}: {
  workspaceSlug: string
}) => {
  const router = useRouter()

  const form = useZodForm({
    schema: inviteMembersSchema,
    defaultValues: {
      email: "",
      workspaceSlug,
      role: utils.ROLES_APP[0],
    },
  })

  const inviteMember = api.workspaces.inviteMember.useMutation({
    onSettled: () => {
      router.refresh()
    },
    onSuccess: () => {
      toastAction("success")
    },
  })

  async function onSubmit(data: InviteMember) {
    await inviteMember.mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="john@doe.com" />
                </FormControl>
                <FormDescription>
                  The email address of the person you want to invite. They must have an account on
                  this app.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {utils.ROLES_APP.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <SubmitButton
            className="mt-8"
            isDisabled={form.formState.isSubmitting}
            isSubmitting={form.formState.isSubmitting}
            label="Invite"
          />
        </div>
      </form>
    </Form>
  )
}
