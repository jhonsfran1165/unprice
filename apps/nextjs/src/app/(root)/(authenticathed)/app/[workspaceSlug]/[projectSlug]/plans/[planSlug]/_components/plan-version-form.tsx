"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"

import { CURRENCIES } from "@builderai/config"
import type { InsertPlanVersion } from "@builderai/db/validators"
import { insertPlanVersionSchema } from "@builderai/db/validators"
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

export function PlanVersionForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertPlanVersion
}) {
  const router = useRouter()
  const editMode = defaultValues.id ? true : false

  const form = useZodForm({
    schema: insertPlanVersionSchema,
    defaultValues: defaultValues,
  })

  const createVersionPlan = api.plans.createVersion.useMutation({
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

  const onSubmitForm = async (data: InsertPlanVersion) => {
    if (!defaultValues.id) {
      await createVersionPlan.mutateAsync(data)
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
        <div className="my-4 space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="FREE"
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Currency of the plan</FormLabel>
                </div>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={editMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((currency, index) => (
                      <SelectItem key={index} value={currency}>
                        {currency}
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

        <div className="mt-8 flex justify-end space-x-2">
          {editMode && (
            <ConfirmAction
              confirmAction={() => {
                setDialogOpen?.(false)
                onDelete()
              }}
            >
              <Button
                variant={"destructive"}
                disabled={deleteFeature.isPending}
              >
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
