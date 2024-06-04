"use client"

import { CheckIcon, ChevronDown, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useMemo, useState } from "react"
import { useFieldArray } from "react-hook-form"

import type { RouterOutputs } from "@builderai/api"
import { COLLECTION_METHODS, SUBSCRIPTION_TYPES } from "@builderai/db/utils"
import type { InsertSubscription } from "@builderai/db/validators"
import { createDefaultSubscriptionConfig, subscriptionInsertSchema } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLoading,
} from "@builderai/ui/command"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@builderai/ui/select"
import { Separator } from "@builderai/ui/separator"
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@builderai/ui/tooltip"

import { ConfirmAction } from "~/components/confirm-action"
import { SubmitButton } from "~/components/submit-button"
import { InputWithAddons } from "~/components/test"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"
import DurationFormField from "./duration-field"
import ConfigItemsFormField from "./items-fields"
import PaymentMethodsFormField from "./payment-method-field"

type PlanVersionResponse = RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]

export function SubscriptionForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertSubscription
}) {
  const router = useRouter()
  const editMode = !!defaultValues.id

  const [selectedPlanVersion, setSelectedPlanVersion] = useState<PlanVersionResponse>()

  const [switcherPlanOpen, setSwitcherPlanOpen] = useState(false)

  const form = useZodForm({
    schema: subscriptionInsertSchema,
    defaultValues: defaultValues,
  })

  const items = useFieldArray({
    control: form.control,
    name: "items",
  })

  const { data, isLoading } = api.planVersions.listByActiveProject.useQuery({
    published: true,
  })

  const subscriptionPlanId = form.watch("planVersionId")

  useMemo(() => {
    if (selectedPlanVersion && subscriptionPlanId) {
      const { err, val: itemsConfig } = createDefaultSubscriptionConfig({
        planVersion: selectedPlanVersion,
      })

      if (err) {
        console.error(err)
        return
      }

      items.replace(itemsConfig)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionPlanId])

  const { data: paymentProviders } = api.customers.listPaymentProviders.useQuery({
    customerId: defaultValues.customerId,
  })

  const createSubscription = api.subscriptions.create.useMutation({
    onSuccess: ({ subscription }) => {
      form.reset(subscription)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const _updateCustomer = api.customers.update.useMutation({
    onSuccess: ({ customer }) => {
      form.reset(customer)
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

  const deleteCustomer = api.customers.remove.useMutation({
    onSuccess: () => {
      toastAction("deleted")
      form.reset()
      router.refresh()
    },
  })

  const onSubmitForm = async (data: InsertSubscription) => {
    if (!defaultValues.id) {
      await createSubscription.mutateAsync(data)
    }

    // if (defaultValues.id && defaultValues.projectId) {
    //   await updateCustomer.mutateAsync({
    //     ...data,
    //     id: defaultValues.id,
    //   })
    // }
  }

  function onDelete() {
    startTransition(() => {
      if (!defaultValues.id) {
        toastAction("error", "no data defined")
        return
      }

      void deleteCustomer.mutateAsync({
        id: defaultValues.id,
      })
    })
  }

  return (
    <Form {...form}>
      <form
        id={"subscription-form"}
        onSubmit={form.handleSubmit(onSubmitForm)}
        className="space-y-6"
      >
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="planVersionId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Plan Version</FormLabel>
                <FormDescription>Select the plan version for the subscription.</FormDescription>
                <div className="text-xs font-normal leading-snug">
                  All the items will be configured based on the plan version
                </div>
                <Popover open={switcherPlanOpen} onOpenChange={setSwitcherPlanOpen}>
                  <PopoverTrigger asChild>
                    <div className="">
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? data?.planVersions.find((version) => version.id === field.value)
                                ?.title
                            : "Select plan"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search a plan..." />
                      <CommandEmpty>No plan found.</CommandEmpty>
                      <CommandGroup>
                        {isLoading && <CommandLoading>Loading...</CommandLoading>}
                        <ScrollArea
                          className={cn({
                            "max-h-24":
                              data?.planVersions?.length && data?.planVersions?.length > 5,
                          })}
                        >
                          {data?.planVersions.map((version) => (
                            <CommandItem
                              value={`${version.title} - v${version.version} - ${version.billingPeriod}`}
                              key={version.id}
                              onSelect={() => {
                                field.onChange(version.id)
                                setSelectedPlanVersion(version)
                                setSwitcherPlanOpen(false)
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  version.id === field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {`${version.title} - v${version.version} - ${version.billingPeriod}`}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex justify-between">
                    <FormLabel>
                      <Tooltip>
                        <div className="flex items-center gap-2">
                          Type of subscription
                          <span>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 font-light" />
                            </TooltipTrigger>
                          </span>
                        </div>

                        <TooltipContent
                          className="bg-background-bg w-32 text-xs font-normal"
                          align="center"
                          side="right"
                        >
                          First unit for the tier range. For the first tier, this should be 0.
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBSCRIPTION_TYPES.map((type) => (
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

            <FormField
              control={form.control}
              name="collectionMethod"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex justify-between">
                    <FormLabel>
                      <Tooltip>
                        <div className="flex items-center gap-2">
                          Collection Method
                          <span>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 font-light" />
                            </TooltipTrigger>
                          </span>
                        </div>

                        <TooltipContent
                          className="bg-background-bg w-32 text-xs font-normal"
                          align="center"
                          side="right"
                        >
                          First unit for the tier range. For the first tier, this should be 0.
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COLLECTION_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <DurationFormField form={form} />

          <FormField
            control={form.control}
            name="trialDays"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Trial Days</FormLabel>
                <div className="flex w-full flex-col lg:w-1/2">
                  <FormControl className="w-full">
                    <InputWithAddons {...field} trailing={"days"} value={field.value ?? ""} />
                  </FormControl>

                  <FormMessage className="self-start pt-1" />
                </div>
              </FormItem>
            )}
          />

          <Separator />

          <PaymentMethodsFormField
            form={form}
            paymentProviders={paymentProviders?.providers ?? []}
            selectedPlanVersion={selectedPlanVersion}
          />

          <Separator />

          <ConfigItemsFormField
            form={form}
            items={items}
            selectedPlanVersion={selectedPlanVersion}
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
              <Button variant={"link"} disabled={deleteCustomer.isPending}>
                Delete
              </Button>
            </ConfirmAction>
          )}
          <SubmitButton
            form="subscription-form"
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
