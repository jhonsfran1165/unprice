import { z } from "zod"

import * as utils from "@builderai/db/utils"
import type {
  CreateFeature,
  PlanVersionFeature,
  UpdateFeature,
} from "@builderai/db/validators"
import {
  createFeatureSchema,
  updateFeatureSchema,
} from "@builderai/db/validators"
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
      feature?: PlanVersionFeature
    }
  | {
      projectSlug: string
      mode: "edit"
      feature: PlanVersionFeature
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

  const featureExist = api.features.featureExist.useMutation()

  // async validation only when creating a new feature
  const forSchema =
    mode === "edit"
      ? updateFeatureSchema
      : createFeatureSchema.extend({
          slug: z
            .string()
            .min(3)
            .refine(async (slug) => {
              const { exist } = await featureExist.mutateAsync({
                projectSlug: projectSlug,
                slug: slug,
              })

              return !exist
            }, "Slug already exists. Change the title of your feature."),
        })

  const form = useZodForm({
    schema: forSchema,
    defaultValues,
  })

  const createFeature = api.features.create.useMutation({
    onSettled: async () => {
      await apiUtils.features.searchBy.invalidate({
        projectSlug: projectSlug,
      })
    },
    onSuccess: (data) => {
      const { feature } = data
      toaster.toast({
        title: "Feature Saved",
        description: `Feature ${feature.title} saved successfully.`,
      })

      form.reset(defaultValues)
    },
  })

  const updateFeature = api.features.update.useMutation({
    onSettled: async () => {
      await apiUtils.features.searchBy.invalidate({
        projectSlug: projectSlug,
      })
    },
    onSuccess: (data) => {
      const { feature } = data
      toaster.toast({
        title: "Feature Saved",
        description: `Feature ${feature.title} saved successfully.`,
      })
    },
  })

  const deleteFeature = api.features.delete.useMutation({
    onSettled: async () => {
      await apiUtils.features.searchBy.invalidate({
        projectSlug: projectSlug,
      })
    },
    onSuccess: (data) => {
      const { feature } = data
      toaster.toast({
        title: "Feature Saved",
        description: `Feature ${feature.slug} deleted successfully.`,
      })
    },
  })

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="link" size={"icon"}>
          {mode === "edit" && <Pencil className="h-4 w-4" />}
          {mode === "create" && <Plus className="h-4 w-4" />}
        </Button>
      </SheetTrigger>
      <SheetContent className="">
        <SheetHeader>
          <SheetTitle>Edit Feature</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you are done.
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
                    projectSlug: projectSlug,
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
                              const slug = utils.slugify(e.target.value)
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

            {/* <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Feature Type</FormLabel>
                    <Link
                      prefetch={false}
                      href="/pricing"
                      target="_blank"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      What&apos;s included in each plan?
                    </Link>
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    value={feature?.type ?? ""}
                  >
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
            /> */}

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
        <SheetFooter className="mt-10">
          {mode === "edit" && (
            <Button
              variant="destructive"
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                await deleteFeature.mutateAsync({
                  id: feature.id,
                  projectSlug: projectSlug,
                })
              }}
            >
              {form.formState.isSubmitting && (
                <div className="mr-2" role="status">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-r-transparent" />
                </div>
              )}

              {"Delete Feature"}
            </Button>
          )}
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
