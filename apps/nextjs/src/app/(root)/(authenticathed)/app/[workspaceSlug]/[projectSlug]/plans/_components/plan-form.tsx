"use client"

import { startTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"

import { PAYMENT_PROVIDERS, PLAN_TYPES } from "@builderai/db/utils"
import type { InsertPlan } from "@builderai/db/validators"
import {
  planInsertBaseSchema,
  planSelectBaseSchema,
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
import { Input } from "@builderai/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { Textarea } from "@builderai/ui/text-area"

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
  const editMode = defaultValues.id ? true : false
  const planExist = api.plans.exist.useMutation()

  const formSchema = editMode
    ? planSelectBaseSchema
    : planInsertBaseSchema.extend({
        slug: z
          .string()
          .min(3)
          .refine(async (slug) => {
            const { exist } = await planExist.mutateAsync({
              slug: slug,
            })

            return !exist
          }, "Plan slug already exists in this app."),
      })

  const form = useZodForm({
    schema: formSchema,
    defaultValues: defaultValues,
  })

  const createPlan = api.plans.create.useMutation({
    onSuccess: ({ plan }) => {
      form.reset(plan)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
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

  const deleteFeature = api.plans.remove.useMutation({
    onSuccess: () => {
      toastAction("deleted")
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

      void deleteFeature.mutateAsync({ id: defaultValues.id })
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
                  The slug is a unique identifier for the plan and will be used
                  for api calls.
                </FormDescription>
                <FormControl>
                  <Input {...field} placeholder="free" disabled={editMode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentProvider"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Payment provider</FormLabel>
                  {/* // TODO: add link to payment provider configuration */}
                  <Link
                    href="#"
                    className="ml-auto inline-block text-xs text-info underline opacity-70"
                  >
                    Configure payment provider
                  </Link>
                </div>

                <FormDescription>
                  In oder to use a payment provider, you need to configure it
                  first for your organization.
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_PROVIDERS.map((provider, index) => (
                      <SelectItem key={index} value={provider}>
                        {provider}
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of the plan</FormLabel>
                <FormDescription>
                  Only recurring plans are supported at the moment.
                </FormDescription>

                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PLAN_TYPES.map((type, index) => (
                      <SelectItem key={index} value={type}>
                        {type}
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
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          {editMode && (
            <ConfirmAction
              confirmAction={() => {
                setDialogOpen?.(false)
                onDelete()
              }}
            >
              <Button variant={"link"} disabled={deleteFeature.isPending}>
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
