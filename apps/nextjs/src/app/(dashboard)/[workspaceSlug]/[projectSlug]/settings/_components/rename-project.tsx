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
import type { RouterOutputs } from "~/trpc/client"
import { apiRQ } from "~/trpc/client"

export function RenameProject(props: {
  project: RouterOutputs["project"]["bySlug"]
}) {
  const { toast } = useToast()
  const apiUtils = apiRQ.useContext()
  const { data, refetch } = apiRQ.project.bySlug.useQuery(
    {
      slug: props.project.slug,
    },
    {
      initialData: props.project,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  )

  const renameProject = apiRQ.project.rename.useMutation({
    onSettled: async () => {
      await refetch()
      await apiUtils.project.listByActiveWorkspace.invalidate(undefined)
    },
    onSuccess: () => {
      toast({
        title: "Project name updated",
      })
    },
    onError: (err) => {
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
    },
  })

  const form = useZodForm({
    schema: renameProjectSchema,
    defaultValues: {
      projectSlug: data.slug,
      name: data.name ?? "",
    },
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Project name</CardTitle>
          <CardDescription>
            Change the display name of your project
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data: RenameProject) => {
              renameProject.mutate(data)
            })}
            className="space-y-2"
          >
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
    </>
  )
}
