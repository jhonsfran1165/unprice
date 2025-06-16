"use client"

import { useRouter } from "next/navigation"
import { startTransition } from "react"
import { z } from "zod"

import type { InsertPlan } from "@unprice/db/validators"
import { planInsertBaseSchema } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { Switch } from "@unprice/ui/switch"
import { Textarea } from "@unprice/ui/text-area"

import { ConfirmAction } from "~/components/confirm-action"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function PlanForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertPlan
}) {
  const router = useRouter()
  const editMode = !!defaultValues.id
  const planExist = api.plans.exist.useMutation()

  const formSchema = editMode
    ? planInsertBaseSchema
    : planInsertBaseSchema.extend({
        slug: z
          .string()
          .min(3)
          .refine(async (slug) => {
            const { exist } = await planExist.mutateAsync({
              slug: slug,
            })

            return !exist
          }, "Plan slug already exists in this project."),
      })

  const form = useZodForm({
    schema: formSchema,
    defaultValues: defaultValues,
    reValidateMode: "onSubmit",
  })

  const createPlan = api.plans.create.useMutation({
    onSuccess: ({ plan }) => {
      form.reset(plan)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
      router.push(`plans/${plan.slug}`)
    },
  })

  const updatePlan = api.plans.update.useMutation({
    onSuccess: ({ plan }) => {
      form.reset(plan)
      toastAction("updated")
      setDialogOpen?.(false)

      // Only needed when the form is inside a uncontrolled dialog - normally updates
      // FIXME: hack to close the dialog when the form is inside a uncontrolled dialog
      if (!setDialogOpen) {
        const escKeyEvent = new KeyboardEvent("keydown", {
          key: "Escape",
        })
        document.dispatchEvent(escKeyEvent)
      }

      router.refresh()
    },
  })

  const deletePlan = api.plans.remove.useMutation({
    onSuccess: () => {
      toastAction("deleted")

      setDialogOpen?.(false)
      // Only needed when the form is inside a uncontrolled dialog - normally updates
      // FIXME: hack to close the dialog when the form is inside a uncontrolled dialog
      if (!setDialogOpen) {
        const escKeyEvent = new KeyboardEvent("keydown", {
          key: "Escape",
        })
        document.dispatchEvent(escKeyEvent)
      }

      form.reset()
      router.refresh()
    },
  })

  const onSubmitForm = async (data: InsertPlan) => {
    if (!defaultValues.id) {
      await createPlan.mutateAsync(data)
    }

    if (defaultValues.id && defaultValues.projectId) {
      await updatePlan.mutateAsync({
        ...data,
        id: defaultValues.id,
      })
    }
  }

  function onDelete() {
    startTransition(() => {
      if (!defaultValues.id) {
        toastAction("error", "no data defined")
        return
      }

      void deletePlan.mutateAsync({ id: defaultValues.id })
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Slug</FormLabel>
                <FormDescription>
                  The slug is a unique identifier for the plan and will be used for api calls.
                </FormDescription>
                <FormControl>
                  <Input {...field} placeholder="FREE" disabled={editMode} />
                </FormControl>
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
                <FormDescription>Enter a short description of the plan.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultPlan"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Default plan</FormLabel>
                  <FormDescription>
                    Mark this plan as the default so that new users are automatically assigned to
                    it. Usually this is the free plan.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enterprisePlan"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enterprise plan</FormLabel>
                  <FormDescription>
                    Enterprises plans don't show prices information in the frontend.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          {editMode && (
            <ConfirmAction
              confirmAction={() => {
                setDialogOpen?.(false)
                onDelete()
              }}
            >
              <Button variant={"link"} disabled={deletePlan.isPending}>
                Delete
              </Button>
            </ConfirmAction>
          )}
          <SubmitButton
            onClick={() => form.handleSubmit(onSubmitForm)()}
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label={editMode ? "Update" : "Create"}
          />
        </div>
      </form>
    </Form>
  )
}
