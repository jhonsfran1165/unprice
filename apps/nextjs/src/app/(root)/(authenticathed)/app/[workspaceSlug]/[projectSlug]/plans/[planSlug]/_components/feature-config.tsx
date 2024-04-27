"use client"

import { useEffect } from "react"
import {
  DollarSignIcon,
  HelpCircle,
  MoreVertical,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react"
import { useFieldArray } from "react-hook-form"

import {
  FEATURE_TYPES,
  FEATURE_TYPES_MAPS,
  TIER_MODES,
  TIER_MODES_MAP,
  USAGE_METERED,
  USAGE_METERED_MAP,
  USAGE_MODES,
  USAGE_MODES_MAP,
} from "@builderai/db/utils"
import type { PlanVersionFeature } from "@builderai/db/validators"
import { planVersionFeatureSchema } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
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
import { Label } from "@builderai/ui/label"
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
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@builderai/ui/tooltip"

import { useZodForm } from "~/lib/zod-form"
import {
  useActiveFeature,
  usePlanActiveTab,
  usePlanFeaturesList,
} from "../../_components/use-features"

export function FeatureConfig() {
  const [activeFeature] = useActiveFeature()
  // define default values config for the form using the feature prop
  const defaultConfigValues = {
    aggregationMethod: "sum",
    price: 0,
    tiers: [{ firstUnit: 0, lastUnit: "Infinity" }],
  }

  const defaultValues = activeFeature?.config
    ? activeFeature
    : {
        ...activeFeature,
        config: defaultConfigValues,
        type: "flat",
      }

  const form = useZodForm({
    schema: planVersionFeatureSchema,
    defaultValues: defaultValues,
  })

  const [planActiveTab] = usePlanActiveTab()
  const [_planFeatures, setPlanFeatures] = usePlanFeaturesList()

  const [_active, setActiveFeature] = useActiveFeature()

  useEffect(() => {
    form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFeature?.id])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.tiers",
  })

  const onSubmitForm = (feature: PlanVersionFeature) => {
    setActiveFeature(feature)
    setPlanFeatures((features) => {
      const activeFeatures = features[planActiveTab]
      const index = activeFeatures.findIndex((f) => f.id === feature.id)

      activeFeatures[index] = feature
      return {
        ...features,
        [planActiveTab]: activeFeatures,
      }
    })
  }

  console.log(form.formState.errors)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center px-4 py-2">
        <h1 className="truncate text-xl font-bold">Feature configuration</h1>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!activeFeature}
                onClick={() => {
                  // delete feature
                  setActiveFeature(null)
                  setPlanFeatures((features) => {
                    const activeFeatures = features[planActiveTab]
                    const index = activeFeatures.findIndex(
                      (f) => f.id === activeFeature?.id
                    )

                    activeFeatures.splice(index, 1)
                    return {
                      ...features,
                      [planActiveTab]: activeFeatures,
                    }
                  })
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete from plan</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete from plan</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!activeFeature}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {activeFeature ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <div className="grid gap-1">
                <div className="line-clamp-1 text-lg font-semibold">
                  {activeFeature.title}
                </div>
                <div className="line-clamp-1 text-xs">
                  slug: <b>{activeFeature.slug}</b>
                </div>
                <div className="line-clamp-1 text-xs">
                  {activeFeature?.description}
                </div>
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              recurring monthly
            </div>
          </div>
          <Separator />

          <ScrollArea className="h-[650px] pb-4">
            <div className="flex-1 space-y-6 whitespace-pre-wrap p-4 text-sm">
              <Form {...form}>
                <form
                  id="feature-config-form"
                  className="space-y-6"
                  onSubmit={form.handleSubmit(onSubmitForm)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="border-1 items-center rounded-md">
                      <div className="space-y-2 rounded-sm border p-2">
                        <div className="rounded-md bg-background-bg p-2 text-center font-semibold shadow-sm">
                          Pricing Model
                        </div>
                        <div className="line-clamp-3 space-y-2 break-all px-2 text-justify text-xs font-normal leading-snug text-muted-foreground">
                          All units price based on final tier reached. Needs a
                          record for Stripe to track customer service usage.
                        </div>
                        <div className="flex flex-col gap-1">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormMessage className="self-start px-2" />
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    form.setValue("usageMode", "")
                                    form.setValue("tierMode", "")
                                  }}
                                  value={field.value ?? ""}
                                >
                                  <FormControl className="truncate">
                                    <SelectTrigger className="items-start [&_[data-description]]:hidden">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {FEATURE_TYPES.map((type, index) => (
                                      <SelectItem value={type} key={index}>
                                        <div className="flex items-start gap-3 text-muted-foreground">
                                          <div className="grid gap-0.5">
                                            <p>
                                              {
                                                FEATURE_TYPES_MAPS[
                                                  type as keyof typeof FEATURE_TYPES_MAPS
                                                ].label
                                              }
                                            </p>
                                            <p
                                              className="text-xs"
                                              data-description
                                            >
                                              {
                                                FEATURE_TYPES_MAPS[
                                                  type as keyof typeof FEATURE_TYPES_MAPS
                                                ].description
                                              }
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

                          {form.watch("type") === "usage" && (
                            <FormField
                              control={form.control}
                              name="usageMode"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormMessage className="self-start px-2" />
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value ?? ""}
                                  >
                                    <FormControl className="truncate">
                                      <SelectTrigger className="items-start [&_[data-description]]:hidden">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {USAGE_MODES.map((mode, index) => (
                                        <SelectItem value={mode} key={index}>
                                          <div className="flex items-start gap-3 text-muted-foreground">
                                            <div className="grid gap-0.5">
                                              <p>
                                                {
                                                  USAGE_MODES_MAP[
                                                    mode as keyof typeof USAGE_MODES_MAP
                                                  ].label
                                                }
                                              </p>
                                              <p
                                                className="text-xs"
                                                data-description
                                              >
                                                {
                                                  USAGE_MODES_MAP[
                                                    mode as keyof typeof USAGE_MODES_MAP
                                                  ].description
                                                }
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
                          )}

                          {(form.watch("type") === "tier" ||
                            form.watch("usageMode") === "tier") && (
                            <FormField
                              control={form.control}
                              name="tierMode"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormMessage className="self-start px-2" />
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value ?? ""}
                                  >
                                    <FormControl className="truncate">
                                      <SelectTrigger className="items-start [&_[data-description]]:hidden">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {TIER_MODES.map((mode, index) => (
                                        <SelectItem value={mode} key={index}>
                                          <div className="flex items-start gap-3 text-muted-foreground">
                                            <div className="grid gap-0.5">
                                              <p>
                                                {
                                                  TIER_MODES_MAP[
                                                    mode as keyof typeof TIER_MODES_MAP
                                                  ].label
                                                }
                                              </p>
                                              <p
                                                className="text-xs"
                                                data-description
                                              >
                                                {
                                                  TIER_MODES_MAP[
                                                    mode as keyof typeof TIER_MODES_MAP
                                                  ].description
                                                }
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
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {form.watch("type") === "flat" && (
                    <div className="flex justify-between gap-2">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="config.price"
                          render={({ field }) => (
                            <FormItem className="">
                              <div className="w-2/3">
                                <FormLabel>Price</FormLabel>
                                <FormDescription>
                                  Price of the feature in the selected currency
                                  of the plan (USD)
                                </FormDescription>
                                <div className="text-xs font-normal leading-snug">
                                  This is the flat price of the feature over the
                                  period of the plan. eg 100 usd per month.
                                  Price of 0 means the feature is free.
                                </div>
                              </div>

                              <div className="flex w-1/3 flex-col items-center space-y-1">
                                <FormControl className="w-full">
                                  <div className="relative">
                                    <DollarSignIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input {...field} className="pl-8" />
                                  </div>
                                </FormControl>

                                <FormMessage className="self-start px-2" />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {["tier"].includes(form.watch("type") ?? "") && (
                    <div className="flex justify-between">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="aggregationMethod"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <div className="">
                                <FormLabel>Aggreation Method</FormLabel>
                                <FormDescription>
                                  Charge for metered usage by
                                </FormDescription>
                                <div className="text-xs font-normal leading-snug">
                                  Different modes of charging for metered usage
                                </div>
                              </div>

                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? ""}
                              >
                                <FormControl className="truncate">
                                  <SelectTrigger className="items-start [&_[data-description]]:hidden">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {USAGE_METERED.map((mode, index) => (
                                    <SelectItem value={mode} key={index}>
                                      <div className="flex items-start gap-3 text-muted-foreground">
                                        <div className="grid gap-0.5">
                                          <p>
                                            {
                                              USAGE_METERED_MAP[
                                                mode as keyof typeof USAGE_METERED_MAP
                                              ].label
                                            }
                                          </p>
                                          <p
                                            className="text-xs"
                                            data-description
                                          >
                                            {
                                              USAGE_METERED_MAP[
                                                mode as keyof typeof USAGE_METERED_MAP
                                              ].description
                                            }
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
                    </div>
                  )}

                  <Separator />

                  {["tier"].includes(form.watch("type") ?? "") && (
                    <div>
                      <div className="mb-4 flex flex-col">
                        <h4 className="my-auto block font-semibold">
                          {form.watch("type") === "volume"
                            ? "Volume tiers"
                            : "Flat tiers"}
                        </h4>
                        <div className="text-xs font-normal leading-snug">
                          Configure the tiers for the feature, the price is
                          based on the mode usage you selected above.
                        </div>
                      </div>

                      {fields.length > 0 ? (
                        <div className="px-2 py-2">
                          {fields.map((field, index) => (
                            <div
                              key={index}
                              className="flex items-end justify-between gap-2 space-y-2"
                            >
                              <div className="flex items-center justify-start">
                                <span className="h-8 text-sm font-light leading-8">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="w-full">
                                <FormField
                                  control={form.control}
                                  key={field.id}
                                  name={`config.tiers.${index}.firstUnit`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel
                                        className={cn(index !== 0 && "sr-only")}
                                      >
                                        <Tooltip>
                                          <div className="flex items-center gap-2 text-xs font-normal">
                                            First Unit
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
                                            First unit for the tier range. For
                                            the first tier, this should be 0.
                                            <TooltipArrow className="fill-background-bg" />
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>

                                      <FormMessage className="text-xs font-light" />
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className="h-8"
                                          disabled={index === 0}
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
                                  name={`config.tiers.${index}.lastUnit`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel
                                        className={cn(index !== 0 && "sr-only")}
                                      >
                                        <Tooltip>
                                          <div className="flex items-center gap-2 text-xs font-normal">
                                            Last Unit
                                            <span>
                                              <TooltipTrigger asChild>
                                                <HelpCircle className="h-4 w-4 font-light" />
                                              </TooltipTrigger>
                                            </span>
                                          </div>

                                          <TooltipContent
                                            className="w-48 bg-background-bg text-xs font-normal"
                                            align="center"
                                            side="right"
                                          >
                                            If the usage is less than the tier
                                            up to value, then the flat price is
                                            charged. For infinite usage, use
                                            9999999.
                                            <TooltipArrow className="fill-background-bg" />
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>

                                      <FormMessage className="text-xs font-light" />

                                      <FormControl>
                                        <Input
                                          {...field}
                                          className="h-8"
                                          value={
                                            field.value === "Infinity"
                                              ? "∞"
                                              : field.value
                                          }
                                          disabled={
                                            (index !== 0 &&
                                              index === fields.length - 1) ||
                                            fields.length === 1
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
                                  name={`config.tiers.${index}.flatPrice`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel
                                        className={cn(index !== 0 && "sr-only")}
                                      >
                                        <Tooltip>
                                          <div className="flex items-center gap-2 text-xs font-normal">
                                            Flat price tier
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
                                            Flat price for this tier.
                                            <TooltipArrow className="fill-background-bg" />
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>

                                      <FormMessage className="text-xs font-light" />

                                      <FormControl>
                                        <div className="relative">
                                          <DollarSignIcon className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            {...field}
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
                                  name={`config.tiers.${index}.unitPrice`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel
                                        className={cn(index !== 0 && "sr-only")}
                                      >
                                        <Tooltip>
                                          <div className="flex items-center gap-2 text-xs font-normal">
                                            Unit price
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
                                            Price per unit
                                            <TooltipArrow className="fill-background-bg" />
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>

                                      <FormMessage className="text-xs font-light" />

                                      <FormControl>
                                        <div className="relative">
                                          <DollarSignIcon className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            {...field}
                                            className="h-8 pl-8"
                                          />
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
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    if (fields.length === 1) return
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

                                  const firstUnitValue = Number(
                                    form.getValues(
                                      `config.tiers.${fields.length - 1}.firstUnit`
                                    )
                                  )

                                  const lastUnitValue = form.getValues(
                                    `config.tiers.${fields.length - 1}.lastUnit`
                                  )

                                  form.setValue(
                                    `config.tiers.${fields.length - 1}.lastUnit`,
                                    lastUnitValue === "Infinity"
                                      ? firstUnitValue + 1
                                      : lastUnitValue
                                  )

                                  append({
                                    firstUnit:
                                      lastUnitValue === "Infinity"
                                        ? firstUnitValue + 2
                                        : lastUnitValue + 1,
                                    flatPrice: 0,
                                    lastUnit: "Infinity",
                                    unitPrice: 0,
                                  })
                                }}
                              >
                                <Plus className="h-3 w-3" />
                                <span className="ml-2">add tier</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </form>
              </Form>
            </div>
          </ScrollArea>

          <Separator className="mt-auto" />
          <div className="p-4">
            <div className="grid gap-4">
              <div className="flex items-center">
                <Label
                  htmlFor="mute"
                  className="flex items-center gap-2 truncate text-xs font-normal"
                >
                  <Switch id="mute" aria-label="Don't show" /> Hide this from
                  preview page
                </Label>
                <Button
                  type="submit"
                  form="feature-config-form"
                  size="sm"
                  className="ml-auto truncate"
                >
                  Save configuration
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No feature selected
        </div>
      )}
    </div>
  )
}
