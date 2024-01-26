import { TRPCClientError } from "@trpc/client"

import type { CreateFeature, Feature } from "@builderai/db/schema/price"
import { createFeatureSchema } from "@builderai/db/schema/price"
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
import { Pencil, Plus } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@builderai/ui/sheet"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

// TODO: support edit mode - see RenameProjectForm
export function FeatureForm({
  projectSlug,
  feature,
  mode = "create",
}: {
  projectSlug: string
  feature?: Feature
  mode?: "create" | "edit"
}) {
  const toaster = useToast()
  const apiUtils = api.useUtils()

  const defaultValues =
    mode === "edit"
      ? feature
      : { projectSlug: projectSlug, title: "", slug: "" }

  const form = useZodForm({
    schema: createFeatureSchema,
    defaultValues,
  })

  const createFeature = api.feature.create.useMutation({
    onSettled: async () => {
      await apiUtils.feature.searchBy.invalidate({
        projectSlug: projectSlug,
      })
    },
    onSuccess: (data) => {
      toaster.toast({
        title: "Feature Created",
        description: `Feature ${data?.title} created successfully.`,
      })

      form.reset()
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Error creating Feature",
          variant: "destructive",
          description:
            "An issue occurred while creating your Feature. Please try again.",
        })
      }
    },
  })

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size={"icon"} className="h-8 w-8">
          {mode === "edit" && <Pencil className="h-4 w-4" />}
          {mode === "create" && <Plus className="h-4 w-4" />}
          <span className="sr-only">configure</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Feature</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id="add-feature"
            onSubmit={form.handleSubmit(async (data: CreateFeature) => {
              await createFeature.mutateAsync(data)
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="New Feature" />
                  </FormControl>
                  <FormDescription>
                    Enter the title of the feature.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="new-feature" />
                  </FormControl>
                  <FormDescription>
                    Enter a unique name for your feature.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter>
          <Button form="add-feature" type="submit">
            {form.formState.isSubmitting && (
              <div className="mr-1" role="status">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-background border-r-transparent" />
              </div>
            )}
            {mode === "edit" && "Save"}
            {mode === "create" && "Create"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
