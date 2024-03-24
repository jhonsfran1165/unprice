"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

import { CURRENCIES } from "@builderai/config"
import { PLAN_BILLING_PERIODS, PLAN_TYPES, slugify } from "@builderai/db/utils"
import type { InsertPlan } from "@builderai/db/validators"
import { insertPlanSchema } from "@builderai/db/validators"
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

  // async validation only when creating a new plan
  const forSchema = editMode
    ? insertPlanSchema
    : insertPlanSchema.extend({
        slug: z
          .string()
          .min(3)
          .refine(async (slug) => {
            const { exist } = await planExist.mutateAsync({
              slug: slug,
            })

            return !exist
          }, "Plan slug already exists in this app. Change the title of your plan."),
      })

  const form = useZodForm({
    schema: forSchema,
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
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmitForm)}>
        <div className="my-4 space-y-4">
          <div className="flex w-full flex-row justify-between space-x-2">
            <div className="w-full">
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
                    <FormLabel>Plan Slug</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly disabled placeholder="free" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Currency of the plan</FormLabel>
                </div>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
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

          <div className="flex w-full flex-row justify-between space-x-2">
            <div className="w-full">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Type of the plan</FormLabel>
                    </div>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
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
            </div>

            <div className="w-full">
              <FormField
                control={form.control}
                name="billingPeriod"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Billing Cycle</FormLabel>
                    </div>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLAN_BILLING_PERIODS.map((type, index) => (
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
            </div>
          </div>

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
