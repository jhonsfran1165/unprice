"use client"

import { startTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  CURRENCIES,
  PAYMENT_PROVIDERS,
  PLAN_BILLING_PERIODS,
  PLAN_TYPES,
} from "@builderai/db/utils"
import type { InsertPlanVersion } from "@builderai/db/validators"
import { versionInsertBaseSchema } from "@builderai/db/validators"
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
  const pathname = usePathname()
  const router = useRouter()
  const editMode = defaultValues.id ? true : false
  const isPublished = defaultValues.status === "published"

  const form = useZodForm({
    schema: versionInsertBaseSchema,
    defaultValues,
  })

  const createPlanVersion = api.planVersions.create.useMutation({
    onSuccess: ({ planVersion }) => {
      form.reset(planVersion)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const updatePlanVersion = api.planVersions.update.useMutation({
    onSuccess: ({ planVersion }) => {
      form.reset(planVersion)
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

  const deletePlanVersion = api.planVersions.remove.useMutation({
    onSuccess: ({ planVersion }) => {
      toastAction("deleted")
      setDialogOpen?.(false)
      form.reset()

      if (pathname.includes(planVersion.id)) {
        router.push(pathname.replace(planVersion.id, ""))
      }

      router.refresh()
    },
  })

  const onSubmitForm = async (data: InsertPlanVersion) => {
    if (!defaultValues.id) {
      await createPlanVersion.mutateAsync(data)
    }

    if (defaultValues.id && defaultValues.projectId) {
      await updatePlanVersion.mutateAsync({
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

      void deletePlanVersion.mutateAsync({ id: defaultValues.id })
    })
  }

  const planType = form.watch("planType")

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-8">
          <FormField
            control={form.control}
            disabled={isPublished}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan version Title</FormLabel>
                <FormDescription>
                  This title will be displayed to your customers. You can use it
                  for handling multiple languages.
                </FormDescription>
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
            disabled={isPublished}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Currency of this version</FormLabel>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-xs text-info underline opacity-70"
                  >
                    Set default currency for this organization
                  </Link>
                </div>

                <FormDescription>
                  You can set a different currency for each version of your
                  plan.
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
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
            name="paymentProvider"
            disabled={isPublished}
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
                  {/* // TODO: use the default payment provider from the organization */}
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
            name="planType"
            disabled={isPublished}
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

          {planType === "recurring" && (
            <FormField
              control={form.control}
              name="billingPeriod"
              disabled={isPublished}
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Billing period</FormLabel>
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a billing period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLAN_BILLING_PERIODS.map((period, index) => (
                        <SelectItem key={index} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            disabled={isPublished}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>
                  Enter a short description of the versions.
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

                // Only needed when the form is inside a uncontrolled dialog - normally updates
                // FIXME: hack to close the dialog when the form is inside a uncontrolled dialog
                if (!setDialogOpen) {
                  const escKeyEvent = new KeyboardEvent("keydown", {
                    key: "Escape",
                  })
                  document.dispatchEvent(escKeyEvent)
                }

                onDelete()
              }}
            >
              <Button variant={"link"} disabled={deletePlanVersion.isPending}>
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
