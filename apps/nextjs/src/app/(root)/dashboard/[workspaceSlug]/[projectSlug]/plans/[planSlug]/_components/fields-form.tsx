"use client"

import { DollarSignIcon, HelpCircle, Plus, XCircle } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import { useFieldArray } from "react-hook-form"

import { AGGREGATION_METHODS, AGGREGATION_METHODS_MAP } from "@unprice/db/utils"
import type { Currency, PlanVersionFeature } from "@unprice/db/validators"

import { currencySymbol } from "@unprice/db/utils"
import { Button } from "@unprice/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@unprice/ui/tooltip"
import { cn } from "@unprice/ui/utils"

import { Typography } from "@unprice/ui/typography"
import { InputWithAddons } from "~/components/input-addons"

export function QuantityFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<PlanVersionFeature>
  isDisabled?: boolean
}) {
  return (
    <div className="w-full">
      <FormField
        control={form.control}
        name="defaultQuantity"
        render={({ field }) => (
          <FormItem className="">
            <FormLabel>Default Quantity</FormLabel>
            <FormDescription>
              Default quantity of the feature when the subscription is created.
            </FormDescription>
            <div className="font-normal text-xs leading-snug">
              If the quantity is not provided, it must be set at the time of the subscription.
            </div>

            <div className="flex flex-col items-center space-y-1">
              <FormControl className="w-full">
                <InputWithAddons
                  {...field}
                  trailing={"units"}
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>

              <FormMessage className="self-start" />
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}

export function LimitFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<PlanVersionFeature>
  isDisabled?: boolean
}) {
  return (
    <div className="w-full">
      <FormField
        control={form.control}
        name="limit"
        render={({ field }) => (
          <FormItem className="">
            <FormLabel>Limit</FormLabel>
            <FormDescription>
              Set a limit for the feature when the subscription is created.
            </FormDescription>
            <div className="font-normal text-xs leading-snug">
              If you set a limit, the feature will be disabled when the limit is reached. Otherwise
              the feature will be unlimited.
            </div>

            <div className="flex flex-col items-center space-y-1">
              <FormControl className="w-full">
                <InputWithAddons
                  {...field}
                  trailing={"units"}
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>

              <FormMessage className="self-start" />
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}

export function PriceFormField({
  form,
  currency,
  isDisabled,
}: {
  form: UseFormReturn<PlanVersionFeature>
  currency: Currency
  isDisabled?: boolean
}) {
  return (
    <div className="w-full">
      <FormField
        control={form.control}
        name="config.price.displayAmount"
        render={({ field }) => (
          <FormItem className="">
            <FormLabel>Price</FormLabel>
            <FormDescription>
              Price of the feature in the selected currency of the plan.
            </FormDescription>
            <div className="font-normal text-xs leading-snug">
              Prices can be set as decimal values. For example, $1.99.
            </div>

            <div className="flex flex-col items-center space-y-1">
              <FormControl className="w-full">
                <InputWithAddons
                  {...field}
                  leading={currencySymbol(currency)}
                  trailing={currency}
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>

              <FormMessage className="self-start" />
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}

export function UnitsFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<PlanVersionFeature>
  isDisabled?: boolean
}) {
  return (
    <div className="w-full">
      <FormField
        control={form.control}
        name="config.units"
        render={({ field }) => (
          <FormItem className="">
            <div className="flex flex-col items-center space-y-1">
              <FormControl className="w-full">
                <InputWithAddons
                  {...field}
                  leading={"per"}
                  trailing={"units"}
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>

              <FormMessage className="self-start" />
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}

export function AggregationMethodFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<PlanVersionFeature>
  isDisabled?: boolean
}) {
  return (
    <div className="w-full">
      <FormField
        control={form.control}
        name="aggregationMethod"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Aggregation Method</FormLabel>
            <FormDescription>Charge for metered usage by</FormDescription>
            <div className="font-normal text-xs leading-snug">
              Usage based features meters usage over a period of time. Select the aggregation method
              for the feature.
            </div>
            <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isDisabled}>
              <FormControl className="truncate">
                <SelectTrigger
                  className="items-start [&_[data-description]]:hidden"
                  disabled={isDisabled}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {AGGREGATION_METHODS.map((mode) => (
                  <SelectItem value={mode} key={mode}>
                    <div className="flex items-start gap-3">
                      <div className="grid gap-0.5">
                        <p>{AGGREGATION_METHODS_MAP[mode].label}</p>
                        <p className="text-xs" data-description>
                          {AGGREGATION_METHODS_MAP[mode].description}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  )
}

export function TierFormField({
  form,
  currency,
  isDisabled,
}: {
  form: UseFormReturn<PlanVersionFeature>
  currency: Currency
  isDisabled?: boolean
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.tiers",
  })

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex flex-col">
        <Typography variant="h4" className="my-auto block">
          Tier Configuration
        </Typography>
        <div className="font-normal text-xs leading-snug">
          {form.getValues("featureType") === "usage"
            ? "Configure the tiers for the feature, the price will be calculated with the reported usage"
            : "Configure the tiers for the feature, the price will be calculated when the subscription is created."}
        </div>
      </div>

      {fields.length > 0 ? (
        <div className="px-2 py-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end justify-between gap-2 space-y-2">
              <div className="flex items-center justify-start">
                <span className="h-8 font-light text-sm leading-8">{index + 1}</span>
              </div>
              <div className="w-full">
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`config.tiers.${index}.firstUnit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        <Tooltip>
                          <div className="flex items-center justify-center gap-2 font-normal text-xs">
                            First Unit
                            <span>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 font-light" />
                              </TooltipTrigger>
                            </span>
                          </div>

                          <TooltipContent
                            className="w-32 bg-background-bg font-normal text-xs"
                            align="center"
                            side="right"
                          >
                            First unit for the tier range. For the first tier, this should be 0.
                            <TooltipArrow className="fill-background-bg" />
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>

                      <FormMessage className="font-light text-xs" />
                      <FormControl>
                        <Input {...field} className="h-8" disabled={index === 0 || isDisabled} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="w-full">
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`config.tiers.${index}.lastUnit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        <Tooltip>
                          <div className="flex items-center justify-center gap-2 font-normal text-xs">
                            Last Unit
                            <span>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 font-light" />
                              </TooltipTrigger>
                            </span>
                          </div>

                          <TooltipContent
                            className="w-48 bg-background-bg font-normal text-xs"
                            align="center"
                            side="right"
                          >
                            If the usage is less than the tier up to value, then the flat price is
                            charged. For infinite usage, use 9999999.
                            <TooltipArrow className="fill-background-bg" />
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>

                      <FormMessage className="font-light text-xs" />

                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          value={field.value ?? "∞"}
                          disabled={
                            (index !== 0 && index === fields.length - 1) ||
                            fields.length === 1 ||
                            isDisabled
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full">
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`config.tiers.${index}.flatPrice.displayAmount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        <Tooltip>
                          <div className="flex items-center justify-center gap-2 font-normal text-xs">
                            Flat price
                            <span>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 font-light" />
                              </TooltipTrigger>
                            </span>
                          </div>

                          <TooltipContent
                            className="w-32 bg-background-bg font-normal text-xs"
                            align="center"
                            side="right"
                          >
                            Flat price of the tier, it will be sum to usage price.
                            <TooltipArrow className="fill-background-bg" />
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>

                      <FormMessage className="font-light text-xs" />

                      <FormControl>
                        <div className="relative">
                          <DollarSignIcon className="absolute top-2 left-2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              field.onChange(e.target.value)

                              // if the value is empty, set the flatPrice to null
                              if (e.target.value === "") {
                                form.setValue(
                                  `config.tiers.${index}.flatPrice.displayAmount`,
                                  "0.00"
                                )
                              }
                            }}
                            className="h-8 pl-8"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full">
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`config.tiers.${index}.unitPrice.displayAmount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        <Tooltip>
                          <div className="flex items-center justify-center gap-2 font-normal text-xs">
                            Unit price
                            <span>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 font-light" />
                              </TooltipTrigger>
                            </span>
                          </div>

                          <TooltipContent
                            className="w-32 bg-background-bg font-normal text-xs"
                            align="center"
                            side="right"
                          >
                            Price per unit
                            <TooltipArrow className="fill-background-bg" />
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>

                      <FormMessage className="font-light text-xs" />

                      <FormControl>
                        <div className="relative">
                          <DollarSignIcon className="absolute top-2 left-2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="h-8 pl-8" />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <Button
                  variant="link"
                  size={"icon"}
                  className="h-8 w-8 rounded-full"
                  disabled={isDisabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    if (fields.length === 1) return

                    // change last unit of the previous tier to the last unit of the current tier
                    form.setValue(
                      `config.tiers.${index - 1}.lastUnit`,
                      form.getValues(`config.tiers.${index}.lastUnit`)
                    )

                    remove(index)
                  }}
                >
                  <XCircle className="h-5 w-5" />
                  <span className="sr-only">delete tier</span>
                </Button>
              </div>
            </div>
          ))}
          <div className="w-full px-2 py-4">
            <div className="flex justify-end">
              <Button
                variant="default"
                size={"sm"}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()

                  if (isDisabled) return

                  const firstUnitValue = Number(
                    form.getValues(`config.tiers.${fields.length - 1}.firstUnit`)
                  )

                  const lastUnitValue = form.getValues(`config.tiers.${fields.length - 1}.lastUnit`)

                  form.setValue(
                    `config.tiers.${fields.length - 1}.lastUnit`,
                    lastUnitValue ?? firstUnitValue + 1
                  )

                  append({
                    firstUnit: lastUnitValue === null ? firstUnitValue + 2 : lastUnitValue + 1,
                    lastUnit: null,
                    unitPrice: {
                      displayAmount: "0.00",
                      dinero: {
                        amount: 0,
                        currency: {
                          code: currency,
                          base: 10,
                          exponent: 2,
                        },
                        scale: 2,
                      },
                    },
                    flatPrice: {
                      displayAmount: "0.00",
                      dinero: {
                        amount: 0,
                        currency: {
                          code: currency,
                          base: 10,
                          exponent: 2,
                        },
                        scale: 2,
                      },
                    },
                  })
                }}
              >
                <Plus className="h-3 w-3" />
                <span className="ml-2">add tier</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="grid gap-2">
                <p className="self-center font-semibold text-sm">No tiers</p>
                <p className="justify-center font-normal text-muted-foreground text-xs leading-snug">
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
                      firstUnit: 1,
                      lastUnit: null,
                      unitPrice: {
                        displayAmount: "0.00",
                        dinero: {
                          amount: 0,
                          currency: {
                            code: currency,
                            base: 10,
                            exponent: 2,
                          },
                          scale: 2,
                        },
                      },
                      flatPrice: {
                        displayAmount: "0.00",
                        dinero: {
                          amount: 0,
                          currency: {
                            code: currency,
                            base: 10,
                            exponent: 2,
                          },
                          scale: 2,
                        },
                      },
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
  )
}
