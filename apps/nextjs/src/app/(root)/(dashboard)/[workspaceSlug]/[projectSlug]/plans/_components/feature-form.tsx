import { TRPCClientError } from "@trpc/client"

import type { CreateFeature } from "@builderai/db/schema/price"
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
import { Pencil } from "@builderai/ui/icons"
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
  featureId,
}: {
  projectSlug: string
  featureId?: string
}) {
  const toaster = useToast()
  const apiUtils = api.useUtils()

  // const [data] = api.feature.getById.useSuspenseQuery({
  //   id: featureId ?? "",
  // })

  // console.log(data)

  const form = useZodForm({
    schema: createFeatureSchema,
    defaultValues: { projectSlug: projectSlug, title: "New Feature" },
  })

  const createFeature = api.feature.create.useMutation({
    onSettled: async () => {
      await apiUtils.feature.listByProject.invalidate({
        projectSlug: projectSlug,
      })
    },
    onSuccess: (feature) => {
      toaster.toast({
        title: "Feature Created",
        description: `Feature ${feature?.title} created successfully.`,
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
          <Pencil className="h-4 w-4" />
          <span className="sr-only">edit</span>
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
            onSubmit={form.handleSubmit((data: CreateFeature) => {
              createFeature.mutate(data)
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
            Create Feature
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
