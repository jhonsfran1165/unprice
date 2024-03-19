"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

import { slugify } from "@builderai/db/utils"
import type { InsertFeature } from "@builderai/db/validators"
import { featureInsertBaseSchema } from "@builderai/db/validators"
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
import { Textarea } from "@builderai/ui/text-area"

import { ConfirmAction } from "~/components/confirm-action"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function FeatureForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertFeature
}) {
  const router = useRouter()

  const featureExist = api.features.exist.useMutation()

  const editMode = defaultValues.id ? true : false

  // async validation only when creating a new feature
  const forSchema = editMode
    ? featureInsertBaseSchema
    : featureInsertBaseSchema.extend({
        slug: z
          .string()
          .min(3)
          .refine(async (slug) => {
            const { exist } = await featureExist.mutateAsync({
              slug: slug,
            })

            return !exist
          }, "Feature slug already exists in this app. Change the title of your feature."),
      })

  const form = useZodForm({
    schema: forSchema,
    defaultValues,
  })

  const createFeature = api.features.create.useMutation({
    onSuccess: ({ feature }) => {
      form.reset(feature)
      toastAction("saved")
      router.refresh()
      setDialogOpen?.(false)
    },
  })

  const updateFeature = api.features.update.useMutation({
    onSuccess: ({ feature }) => {
      form.reset(feature)
      toastAction("updated")
      router.refresh()
      setDialogOpen?.(false)
    },
  })

  const deleteFeature = api.features.remove.useMutation({
    onSuccess: () => {
      toastAction("deleted")
      form.reset()
      router.refresh()
    },
  })

  function onDelete() {
    startTransition(() => {
      if (!defaultValues.id) return
      void deleteFeature.mutateAsync({ id: defaultValues.id })
    })
  }

  const onSubmitForm = async (data: InsertFeature) => {
    if (!defaultValues.id) {
      await createFeature.mutateAsync(data)
    }

    if (defaultValues.id) {
      await updateFeature.mutateAsync({ ...data, id: defaultValues.id })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
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
                      placeholder="Custom Domains"
                      onChange={(e) => {
                        field.onChange(e)
                        if (!editMode) {
                          const slug = slugify(e.target.value)
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
                      placeholder="custom-domains"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Grants the user the access to custom domains feature"
                />
              </FormControl>
              <FormDescription>
                Enter a short description of the feature.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-8 flex justify-end space-x-2">
          {editMode && (
            <ConfirmAction
              confirmAction={() => {
                setDialogOpen?.(false)
                onDelete()
              }}
            >
              <Button variant={"destructive"}>Delete</Button>
            </ConfirmAction>
          )}
          <SubmitButton
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label={editMode ? "Update" : "Create"}
          />
        </div>
      </form>
    </Form>
  )
}
