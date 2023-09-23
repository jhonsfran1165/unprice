"use client"

import { TRPCClientError } from "@trpc/client"

import type { RenameProject } from "@builderai/db/schema"
import { renameProjectSchema } from "@builderai/db/schema"
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
import { Input } from "@builderai/ui/input"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function RenameProject(props: {
  currentName: string
  projectSlug: string
}) {
  const { toast } = useToast()

  const form = useZodForm({
    schema: renameProjectSchema,
    defaultValues: {
      projectSlug: props.projectSlug,
      name: props.currentName,
    },
  })

  async function onSubmit(data: RenameProject) {
    try {
      await api.project.rename.mutate(data)
      toast({
        title: "Project name updated",
        description: "Your project's name has been updated.",
      })
    } catch (err) {
      if (err instanceof TRPCClientError) {
        toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Project could not be deleted",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project name</CardTitle>
        <CardDescription>
          Change the display name of your project
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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
          <CardFooter>
            <Button type="submit" className="ml-auto">
              Save
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
