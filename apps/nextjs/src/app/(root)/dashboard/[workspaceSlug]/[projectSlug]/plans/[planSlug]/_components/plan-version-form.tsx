"use client"
import { usePathname, useRouter } from "next/navigation"
import { startTransition } from "react"

import { CURRENCIES, PAYMENT_PROVIDERS, PLAN_BILLING_PERIODS, PLAN_TYPES } from "@unprice/db/utils"
import type { InsertPlanVersion } from "@unprice/db/validators"
import { planVersionSelectBaseSchema, versionInsertBaseSchema } from "@unprice/db/validators"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { Textarea } from "@unprice/ui/text-area"

import { Switch } from "@unprice/ui/switch"
import type { z } from "zod"
import { ConfirmAction } from "~/components/confirm-action"
import { SubmitButton } from "~/components/submit-button"
import { SuperLink } from "~/components/super-link"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"
import { BannerPublishedVersion } from "../[planVersionId]/_components/banner"

const isPublishedSchema = planVersionSelectBaseSchema.partial().required({
  id: true,
  projectId: true,
})

export function PlanVersionForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertPlanVersion
}) {
  const pathname = usePathname()
  const router = useRouter()
  const editMode = !!defaultValues.id
  const isPublished = defaultValues.status === "published"

  const form = useZodForm({
    schema: isPublished ? isPublishedSchema : versionInsertBaseSchema,
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

  const onSubmitForm = async (data: InsertPlanVersion | z.infer<typeof isPublishedSchema>) => {
    if (!defaultValues.id && !isPublished) {
      await createPlanVersion.mutateAsync(data as InsertPlanVersion)
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
        {isPublished && <BannerPublishedVersion />}

        <FormField
          control={form.control}
          name="metadata.paymentMethodRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Payment method required</FormLabel>
                <FormDescription>
                  If this plan version requires a payment method, customers will be redirected to
                  the payment provider to enter their payment method.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  disabled={isPublished}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:space-y-4">
          <FormField
            control={form.control}
            disabled={isPublished}
            name="title"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <FormLabel>Plan version Title</FormLabel>
                <FormDescription>
                  This title will be displayed to your customers. You can use it for handling
                  multiple languages.
                </FormDescription>
                <FormControl>
                  <Input {...field} placeholder="FREE" onChange={field.onChange} />
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
              <FormItem className="flex flex-col justify-end">
                <div className="flex justify-between">
                  <FormLabel>Currency of this version</FormLabel>
                  {/* // TODO: add link to currency configuration */}
                  <SuperLink
                    href="#"
                    className="ml-auto inline-block text-info text-xs underline opacity-70"
                  >
                    Set default currency for this organization
                  </SuperLink>
                </div>

                <FormDescription>
                  You can set a different currency for each version of your plan.
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={isPublished}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
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
            name="planType"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <FormLabel>Type of the plan</FormLabel>
                <FormDescription>Only recurring plans are supported at the moment.</FormDescription>

                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={isPublished}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PLAN_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
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
                <FormItem className="col-start-2 flex flex-col justify-end">
                  <FormLabel>Billing period</FormLabel>
                  <FormDescription>How often you want to bill customers</FormDescription>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={isPublished}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a billing period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLAN_BILLING_PERIODS.map((period) => (
                        <SelectItem key={period} value={period}>
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
            name="paymentProvider"
            disabled={isPublished}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <div className="flex justify-between">
                  <FormLabel>Payment provider</FormLabel>
                  {/* // TODO: add link to payment provider configuration */}
                  <SuperLink
                    href="#"
                    className="ml-auto inline-block text-info text-xs underline opacity-70"
                  >
                    Configure payment provider
                  </SuperLink>
                </div>

                <FormDescription>
                  In oder to use a payment provider, you need to configure it first for your
                  organization.
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={isPublished}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                  </FormControl>
                  {/* // TODO: use the default payment provider from the organization */}
                  <SelectContent>
                    {PAYMENT_PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider}>
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
            name="description"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-start">
                <FormLabel>Description</FormLabel>
                <FormDescription>Enter a short description of the versions.</FormDescription>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} />
                </FormControl>
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
