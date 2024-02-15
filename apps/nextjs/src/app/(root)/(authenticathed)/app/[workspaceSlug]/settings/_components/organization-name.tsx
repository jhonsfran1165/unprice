"use client"

import * as React from "react"
import { z } from "zod"

import { useOrganization } from "@builderai/auth"
import { Button } from "@builderai/ui/button"
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
import { Spinner } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"

export const renameOrgSchema = z.object({
  name: z.string().min(4, "Name must be at least 5 characters"),
})

export type OrgForm = z.infer<typeof renameOrgSchema>

export function OrganizationName(props: { name: string; orgSlug: string }) {
  const { organization } = useOrganization()
  const [isUpdating, setIsUpdating] = React.useState(false)
  const { toast } = useToast()

  const form = useZodForm({
    schema: renameOrgSchema,
    defaultValues: {
      name: props.name,
    },
  })

  const handleSubmit = async (data: OrgForm) => {
    const { name } = data

    try {
      setIsUpdating(true)
      await organization?.update({ name, slug: props.orgSlug })
      toast({
        title: "Organization name updated",
        description: "Your organization name has been updated.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        description: JSON.stringify(error),
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Name</CardTitle>
        <CardDescription>Change the name of your organization</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form
          className="flex flex-col space-y-2"
          onSubmit={form.handleSubmit(handleSubmit)}
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
            <Button type="submit" className="ml-auto" disabled={isUpdating}>
              {isUpdating && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
