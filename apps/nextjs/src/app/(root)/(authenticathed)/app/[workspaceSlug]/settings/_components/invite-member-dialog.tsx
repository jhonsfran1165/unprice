"use client"

import { TRPCClientError } from "@trpc/client"

import { MEMBERSHIP } from "@builderai/config"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { useToast } from "@builderai/ui/use-toast"
import type { InviteOrgMember } from "@builderai/validators/workspace"
import { inviteOrgMemberSchema } from "@builderai/validators/workspace"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export const InviteMemberForm = () => {
  const toaster = useToast()

  const form = useZodForm({
    schema: inviteOrgMemberSchema,
  })

  const inviteMember = api.workspaces.inviteMember.useMutation({
    onSuccess: (data) => {
      toaster.toast({
        title: "Member invited",
        description: `An invitation to ${data.name} has been sent.`,
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
          title: "Invitation failed",
          variant: "destructive",
          description: `An issue occurred while inviting the member. Make sure they have an account, and try again.`,
        })
      }
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data: InviteOrgMember) =>
          inviteMember.mutate(data)
        )}
        className="space-y-4"
      >
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
                The email address of the person you want to invite. They must
                have an account on this app.
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
              <Select
                onValueChange={(val) =>
                  field.onChange(
                    val as (typeof MEMBERSHIP)[keyof typeof MEMBERSHIP]
                  )
                }
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(MEMBERSHIP).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Project</Button>
      </form>
    </Form>
  )
}
