import { TRPCClientError } from "@trpc/client"

import type { CreateFeature } from "@builderai/db/schema/price"
import { createFeatureSchema } from "@builderai/db/schema/price"
import { Button } from "@builderai/ui/button"
import {
  Dialog,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Settings } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { Label } from "@builderai/ui/label"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function FeatureConfigForm({ projectSlug }: { projectSlug: string }) {
  const toaster = useToast()
  const apiUtils = api.useUtils()

  const form = useZodForm({
    schema: createFeatureSchema,
    defaultValues: { projectSlug: projectSlug, title: "New Feature" },
  })

  const createFeature = api.feature.create.useMutation({
    onSettled: async () => {
      await apiUtils.apikey.listApiKeys.invalidate({
        projectSlug: projectSlug,
      })
    },
    onSuccess: (feature) => {
      toaster.toast({
        title: "API Key Created",
        description: `ApiKey ${feature?.title} created successfully.`,
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
          title: "Error creating API Key",
          variant: "destructive",
          description:
            "An issue occurred while creating your key. Please try again.",
        })
      }
    },
  })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size={"icon"} className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">configure</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data: CreateFeature) =>
              createFeature.mutate(data)
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="New Token" />
                  </FormControl>
                  <FormDescription>
                    Enter a unique name for your token to differentiate it from
                    other tokens.
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
                    <Input {...field} placeholder="New Token" />
                  </FormControl>
                  <FormDescription>
                    Enter a unique name for your token to differentiate it from
                    other tokens.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">
              {form.formState.isSubmitting && (
                <div className="mr-1" role="status">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-background border-r-transparent" />
                </div>
              )}
              Create Key
            </Button>
          </form>
        </Form>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              defaultValue="Pedro Duarte"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              defaultValue="@peduarte"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
