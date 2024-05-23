"use client"

import { startTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, CheckIcon, ChevronDown, HelpCircle } from "lucide-react"
import { useFieldArray } from "react-hook-form"

import type { RouterOutputs } from "@builderai/api"
import { COLLECTION_METHODS, SUBSCRIPTION_TYPES } from "@builderai/db/utils"
import type {
  InsertSubscription,
  SubscriptionItem,
} from "@builderai/db/validators"
import {
  configFlatSchema,
  configTierSchema,
  configUsageSchema,
  subscriptionInsertSchema,
} from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Calendar } from "@builderai/ui/calendar"
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
import { Input } from "@builderai/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { ScrollArea } from "@builderai/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { Separator } from "@builderai/ui/separator"
import { Switch } from "@builderai/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@builderai/ui/table"
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@builderai/ui/tooltip"

import { ConfirmAction } from "~/components/confirm-action"
import { SubmitButton } from "~/components/submit-button"
import { formatDate } from "~/lib/dates"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

type PlanVersionResponse =
  RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]

type PlanVersionFeaturesResponse =
  RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]["planFeatures"][0]

export function SubscriptionForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertSubscription
}) {
  const router = useRouter()
  const editMode = defaultValues.id ? true : false
  const [selectedPlanVersionFeatures, setSelectedPlanVersionFeatures] =
    useState<Map<string, PlanVersionFeaturesResponse>>()
  const [selectedPlanVersion, setSelectedPlanVersion] =
    useState<PlanVersionResponse>()

  const form = useZodForm({
    schema: subscriptionInsertSchema,
    defaultValues: defaultValues,
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const { data, isLoading } = api.planVersions.listByActiveProject.useQuery({
    published: true,
  })

  const createSubscription = api.subscriptions.create.useMutation({
    onSuccess: ({ subscription }) => {
      form.reset(subscription)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const updateCustomer = api.customers.update.useMutation({
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

  const calculateTotal = (id: string, quantity: number) => {
    const feature = selectedPlanVersionFeatures?.get(id)

    if (!feature) {
      toastAction("error", `feature with ${id} not found`)
      return 0
    }

    const billingPeriod = selectedPlanVersion?.billingPeriod

    console.log("quantity", quantity)

    switch (feature.featureType) {
      case "usage": {
        const { tiers, usageMode, units, price } = configUsageSchema.parse(
          feature.config
        )

        if (usageMode === "tier" && tiers && tiers.length > 0) {
          /**
        Calculation logic:
        */
          let remaining = quantity // make a copy, so we don't mutate the original
          const res = { totalCentsEstimate: 0 }

          for (const tier of tiers) {
            if (quantity <= 0) {
              break
            }

            const quantityCalculation =
              tier.lastUnit === null
                ? remaining
                : Math.min(tier.lastUnit - tier.firstUnit + 1, remaining)
            remaining -= quantityCalculation

            if (tier.unitPrice) {
              res.totalCentsEstimate +=
                quantityCalculation * Number.parseFloat(tier.unitPrice)
            }
            if (tier.flatPrice) {
              res.totalCentsEstimate += Number.parseFloat(tier.flatPrice)
            }
          }

          return `starts at $${res.totalCentsEstimate.toFixed(2)}/${billingPeriod}`
        }

        if (usageMode === "unit" && price) {
          return `starts at $${(Number.parseFloat(price) * quantity).toFixed(2)}/${billingPeriod}`
        }

        if (usageMode === "package" && units && price) {
          // round up to the next package
          const packageCount = Math.ceil(quantity / units)
          return `starts at $${(Number.parseFloat(price) * packageCount).toFixed(2)}/${billingPeriod}`
        }

        return `starts at $0/${billingPeriod}`
      }
      case "flat": {
        const { price } = configFlatSchema.parse(feature.config)
        const priceInCents = Math.floor(parseFloat(price)).toFixed(2)

        return `$${Math.floor(parseFloat(priceInCents) * quantity).toFixed(2)}/${billingPeriod}`
      }
      case "tier": {
        const { tiers } = configTierSchema.parse(feature.config)

        // find the tier that the quantity falls into
        const tier = tiers.find(
          (tier) =>
            quantity >= tier.firstUnit &&
            (tier.lastUnit === null || quantity <= tier.lastUnit)
        )

        if (!tier) {
          return "n/a"
        }

        console.log("tier", tier)

        let totalPrice = 0

        if (tier.unitPrice) {
          console.log("unitPrice", Number.parseFloat(tier.unitPrice))
          console.log("quantity", quantity)
          console.log(quantity * Number.parseFloat(tier.unitPrice))
          totalPrice = quantity * Number.parseFloat(tier.unitPrice)
        }

        console.log("totalPrice", totalPrice)

        if (tier.flatPrice) {
          totalPrice += Number.parseFloat(tier.flatPrice)
        }
        console.log("totalPrice", totalPrice)

        return `$${totalPrice.toFixed(2)}/${billingPeriod}`
      }
      default:
        return "n/a"
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="planVersionId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Plan Version</FormLabel>
                <FormDescription>
                  Set a limit for the feature when the subscription is created.
                </FormDescription>
                <div className="text-xs font-normal leading-snug">
                  If you set a limit, the feature will be disabled when the
                  limit is reached. Otherwise the feature will be unlimited.
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="px-2">
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? data?.planVersions.find(
                                (version) => version.id === field.value
                              )?.title
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
                        {isLoading && (
                          <CommandLoading>Loading...</CommandLoading>
                        )}
                        <ScrollArea className="h-24">
                          {data?.planVersions.map((version) => (
                            <CommandItem
                              value={`${version.title} - v${version.version} - ${version.billingPeriod}`}
                              key={version.id}
                              onSelect={() => {
                                form.setValue("planVersionId", version.id)

                                const map = new Map<
                                  string,
                                  PlanVersionFeaturesResponse
                                >()

                                const itemsConfig =
                                  version.planFeatures.map((feature) => {
                                    map.set(feature.featureId, feature)

                                    return {
                                      itemType: "feature",
                                      quantity: feature.defaultQuantity ?? 0,
                                      limit: feature.limit,
                                      itemId: feature.featureId,
                                      slug: feature.feature.slug,
                                    } as SubscriptionItem
                                  }) ?? []

                                setSelectedPlanVersion(version)
                                setSelectedPlanVersionFeatures(map)

                                replace(itemsConfig)
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  version.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
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

          <div className="flex flex-row items-center justify-between space-x-2 px-2">
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
                          className="w-32 bg-background-bg text-xs font-normal"
                          align="center"
                          side="right"
                        >
                          First unit for the tier range. For the first tier,
                          this should be 0.
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
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
                      {SUBSCRIPTION_TYPES.map((type, index) => (
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
                          className="w-32 bg-background-bg text-xs font-normal"
                          align="center"
                          side="right"
                        >
                          First unit for the tier range. For the first tier,
                          this should be 0.
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
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
                      {COLLECTION_METHODS.map((method, index) => (
                        <SelectItem key={index} value={method}>
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

          <FormField
            control={form.control}
            name="autoRenew"
            render={({ field }) => (
              <FormItem className="mx-2 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-semibold">
                    Auto Renew Subscription
                  </FormLabel>
                  <FormDescription className="text-sm font-normal">
                    When enabled, this feature will not be visible in pricing
                    pages.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Separator />

          <div className="flex flex-row items-center justify-between space-x-2 px-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>
                    <Tooltip>
                      <div className="flex items-center gap-2">
                        Start Date
                        <span>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 font-light" />
                          </TooltipTrigger>
                        </span>
                      </div>

                      <TooltipContent
                        className="w-32 bg-background-bg text-xs font-normal"
                        align="center"
                        side="right"
                      >
                        First unit for the tier range. For the first tier, this
                        should be 0.
                        <TooltipArrow className="fill-background-bg" />
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value)
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>
                    <Tooltip>
                      <div className="flex items-center gap-2">
                        End Date
                        <span>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 font-light" />
                          </TooltipTrigger>
                        </span>
                      </div>

                      <TooltipContent
                        className="w-32 bg-background-bg text-xs font-normal"
                        align="center"
                        side="right"
                      >
                        First unit for the tier range. For the first tier, this
                        should be 0.
                        <TooltipArrow className="fill-background-bg" />
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value)
                          ) : (
                            <span>Forever</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="trialDays"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel>Trial Days</FormLabel>
                <FormDescription>
                  Set a limit for the feature when the subscription is created.
                </FormDescription>
                <div className="text-xs font-normal leading-snug">
                  If you set a limit, the feature will be disabled when the
                  limit is reached. Otherwise the feature will be unlimited.
                </div>

                <div className="flex flex-col items-center space-y-1 px-2">
                  <FormControl className="w-full">
                    <div className="flex flex-row items-center">
                      <div className="relative flex-1">
                        <Input
                          {...field}
                          className="rounded-e-none rounded-s-md"
                          value={field.value ?? ""}
                        />
                      </div>
                      <div
                        className={
                          "inline-flex h-9 items-center justify-center rounded-e-md rounded-s-none border border-l-0 bg-background-bg px-3 text-sm font-medium"
                        }
                      >
                        days
                      </div>
                    </div>
                  </FormControl>

                  <FormMessage className="self-start px-2" />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex w-full flex-col">
          <div className="mb-4 flex flex-col">
            <h4 className="my-auto block font-semibold">Items configuration</h4>
            <div className="text-xs font-normal leading-snug">
              {form.getValues("type") === "addons"
                ? "Configure the tiers for the feature, the price will be calculated with the reported usage"
                : "Configure the tiers for the feature, the price will be calculated when the subscription is created."}
            </div>
          </div>

          <div className="px-2 py-2">
            {fields.length > 0 ? (
              <Table>
                <TableHeader className="border-b border-t">
                  <TableRow className="pointer-events-none">
                    <TableHead className="h-10 px-4">Item</TableHead>
                    <TableHead className="h-10 px-4">Quantity</TableHead>
                    <TableHead className="h-10 pr-4 text-end">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow
                      key={field.id}
                      className="border-b hover:bg-transparent"
                    >
                      <TableCell>{field.slug}</TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          key={field.id}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormMessage className="text-xs font-light" />
                              {/* // TODO: depending on the feature quantity should be disabled */}
                              <FormControl>
                                <Input {...field} className="h-8 w-16" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="pr-4 text-end text-xs italic">
                        {calculateTotal(
                          field.itemId,
                          form.getValues(`items.${index}.quantity`) ?? 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid gap-2">
                      <p
                        className="
                   self-center text-sm font-semibold"
                      >
                        No tiers
                      </p>
                      <p className="justify-center  text-xs font-normal leading-snug text-muted-foreground">
                        Something went wrong, please add the first tier.
                      </p>
                      <Button
                        variant="default"
                        size={"sm"}
                        className="py-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          append({
                            itemType: "addon",
                            quantity: 0,
                            limit: 0,
                            itemId: "",
                          })
                        }}
                      >
                        Add first tier
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
