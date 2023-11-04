"use client"

import { TRPCClientError } from "@trpc/client"

import type { RenameProject } from "@builderai/db/schema/project"
import { renameProjectSchema } from "@builderai/db/schema/project"
import { Button } from "@builderai/ui/button"
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

export function RenameProjectForm(props: {
  project: RouterOutputs["project"]["bySlug"]
}) {
  const { toast } = useToast()
  const apiUtils = apiRQ.useContext()
  const { data, refetch } = apiRQ.project.bySlug.useQuery(
    {
      slug: props.project.slug,
    },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      initialData: props.project,
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
      projectSlug: data?.slug,
      name: data?.name ?? "",
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data: RenameProject) => {
          renameProject.mutate(data)
        })}
        className="space-y-2"
      >
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
        <div className="flex pt-4">
          <Button type="submit" className="ml-auto">
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}
