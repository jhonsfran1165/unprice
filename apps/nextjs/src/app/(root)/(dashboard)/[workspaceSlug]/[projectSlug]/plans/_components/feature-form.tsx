import Link from "next/link"
import { TRPCClientError } from "@trpc/client"
import { z } from "zod"

import { FEATURE_TYPES } from "@builderai/db/schema/enums"
import type {
  CreateFeature,
  Feature,
  UpdateFeature,
} from "@builderai/db/schema/price"
import {
  createFeatureSchema,
  updateFeatureSchema,
} from "@builderai/db/schema/price"
import { createSlug } from "@builderai/db/utils"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { Separator } from "@builderai/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@builderai/ui/sheet"
import { Textarea } from "@builderai/ui/text-area"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

type FeatureFormProps =
  | {
      projectSlug: string
      mode: "create"
      feature?: Feature
    }
  | {
      projectSlug: string
      mode: "edit"
      feature: Feature
    }

export function FeatureForm({ projectSlug, feature, mode }: FeatureFormProps) {
  const toaster = useToast()
  const apiUtils = api.useUtils()

  const defaultValues =
    mode === "edit"
      ? feature
      : {
          projectSlug: projectSlug,
          title: "",
          slug: "",
          description: "",
        }

  const featureExist = api.feature.featureExist.useMutation()

  // async validation only when creating a new feature
  const forSchema =
    mode === "edit"
      ? updateFeatureSchema
      : createFeatureSchema.extend({
          slug: z
            .string()
            .min(3)
            .refine(async (slug) => {
              const data = await featureExist.mutateAsync({
                projectSlug: projectSlug,
                slug: slug,
              })

              if (data.feature?.id) {
                return false
              }

              return true
            }, "Slug already exists. Change the title of your feature."),
        })

  const form = useZodForm({
    schema: forSchema,
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
        title: "Feature Saved",
        description: `Feature ${data?.title} saved successfully.`,
      })

      form.reset(defaultValues)
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Error saving Feature",
          variant: "destructive",
          description:
            "An issue occurred while saving your Feature. Please try again.",
        })
      }
    },
  })

  const updateFeature = api.feature.update.useMutation({
    onSettled: async () => {
      await apiUtils.feature.searchBy.invalidate({
        projectSlug: projectSlug,
      })
    },
    onSuccess: (data) => {
      toaster.toast({
        title: "Feature Saved",
        description: `Feature ${data?.title} saved successfully.`,
      })

      form.reset(defaultValues)
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Error saving Feature",
          variant: "destructive",
          description:
            "An issue occurred while saving your Feature. Please try again.",
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
        <Separator className="my-4" />
        <Form {...form}>
          <form
            id="add-feature"
            onSubmit={form.handleSubmit(
              async (data: CreateFeature | UpdateFeature) => {
                if (mode === "edit") {
                  await updateFeature.mutateAsync({
                    ...(data as UpdateFeature),
                    id: feature.id,
                  })
                  return
                } else if (mode === "create") {
                  await createFeature.mutateAsync(data as CreateFeature)
                  return
                }
              }
            )}
            className="space-y-6"
          >
            <div className="flex justify-between gap-2">
              <div className="w-full">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Title for your feature"
                          onChange={(e) => {
                            form.setValue("title", e.target.value)
                            if (mode === "create") {
                              const slug = createSlug(e.target.value)
                              form.setValue("slug", slug)
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="w-full">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Slug"
                          readOnly
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Subscription plan *</FormLabel>
                    <Link
                      prefetch={false}
                      href="/pricing"
                      target="_blank"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      What&apos;s included in each plan?
                    </Link>
                  </div>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FEATURE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          <span className="font-medium">{type}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Enter a short description of the feature.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter>
          <Button
            form="add-feature"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <div className="mr-2" role="status">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-r-transparent" />
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
