import { useEffect } from "react"
import { addDays, addHours, format, nextSaturday } from "date-fns"
import {
  Clock,
  DollarSignIcon,
  Forward,
  HelpCircle,
  MoreVertical,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react"
import { useFieldArray } from "react-hook-form"

import { planVersionFeatureSchema } from "@builderai/db/schema"
import { TIER_MODES, TIER_MODES_MAP } from "@builderai/db/utils"
import type { PlanVersionFeature } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Calendar } from "@builderai/ui/calendar"
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
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { RadioGroup, RadioGroupItem } from "@builderai/ui/radio-group"
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

interface FeatureConfigProps {
  feature: PlanVersionFeature | null
}

export function FeatureConfig({ feature }: FeatureConfigProps) {
  const today = new Date()

  const defaultValues =
    feature?.type === "flat"
      ? {
          price: 0,
          divider: 0,
        }
      : feature?.type === "tiered"
        ? {
            mode: "sum",
            divider: 0,
            tiers: [{ first: 0, price: 0, last: 0 }],
          }
        : {
            module: "sum",
            divider: 0,
            tiers: [{ first: 0, price: 0, last: 0 }],
          }

  const form = useZodForm({
    schema: planVersionFeatureSchema,
  })

  useEffect(() => {
    form.reset({
      config: feature?.config ?? defaultValues,
      ...feature,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature?.id])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.tiers",
  })

  const onSubmitForm = async (feature: PlanVersionFeature) => {
    console.log("feature", feature)
  }

  console.log("formStatus", form.formState)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!feature}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete from plan</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete from plan</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!feature}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Later today{" "}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(today, 4), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 1), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(today), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 7), "E, h:m b")}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!feature}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!feature}>
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
      {feature ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <div className="grid gap-1">
                <div className="line-clamp-1 text-lg font-semibold">
                  {feature.title}
                </div>
                <div className="line-clamp-1 text-xs">
                  slug: <b>{feature.slug}</b>
                </div>
                <div className="line-clamp-1 text-xs">
                  {feature.description}
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
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Type</FormLabel>
                        <FormDescription>
                          Select the type of feature you want
                        </FormDescription>
                        <FormMessage />
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value ?? "flat"}
                          className="grid grid-cols-3 gap-2 pt-2"
                        >
                          <FormItem>
                            <FormLabel className="[&:has([data-state=checked])>div]:border-background-border">
                              <FormControl>
                                <RadioGroupItem
                                  value="flat"
                                  className="sr-only"
                                />
                              </FormControl>
                              <div className="h-[115px] items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                                <div className="space-y-2 rounded-sm p-2">
                                  <div className="rounded-md bg-background-bg p-2 text-center font-semibold shadow-sm">
                                    Flat
                                  </div>
                                  <div className="line-clamp-3 break-all px-1 text-justify text-xs font-normal leading-snug text-muted-foreground">
                                    Flat features are charged at a fixed price
                                  </div>
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className="[&:has([data-state=checked])>div]:border-background-border">
                              <FormControl>
                                <RadioGroupItem
                                  value="tiered"
                                  className="sr-only"
                                />
                              </FormControl>

                              <div className="h-[115px] items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                                <div className="space-y-2 rounded-sm p-2">
                                  <div className="rounded-md bg-background-bg p-2 text-center font-semibold shadow-sm">
                                    Tier
                                  </div>
                                  <div className="line-clamp-3 break-all px-1 text-justify text-xs font-normal leading-snug text-muted-foreground">
                                    The amount to charge varies incrementally as
                                    usage increases, different units may be at
                                    different prices depending on the tier they
                                    fall into. We also support defining distinct
                                    pricing types for each slab.
                                  </div>
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className="[&:has([data-state=checked])>div]:border-background-border">
                              <FormControl>
                                <RadioGroupItem
                                  value="volume"
                                  className="sr-only"
                                />
                              </FormControl>
                              <div className="h-[115px] items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                                <div className="space-y-2 rounded-sm p-2">
                                  <div className="rounded-md bg-background-bg p-2 text-center font-semibold shadow-sm">
                                    Volume
                                  </div>
                                  <div className="line-clamp-3 break-all px-1 text-justify text-xs font-normal leading-snug text-muted-foreground">
                                    Similar to the tiered pricing model, except
                                    that only one slab is applied at the end of
                                    the billing period based on the total usage
                                    units.
                                  </div>
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {form.watch("type") === "flat" && (
                    <div className="flex justify-between gap-2">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="config.price"
                          render={({ field }) => (
                            <FormItem className="flex flex-row space-x-4">
                              <div className="w-2/3">
                                <FormLabel>Price</FormLabel>
                                <FormDescription>
                                  Price of the feature in the selected currency
                                  of the plan (USD)
                                </FormDescription>
                                <div className="text-xs font-normal leading-snug">
                                  This is the flat price of the feature over the
                                  period of the plan. eg 100 usd per month
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

                  {["volume", "tiered"].includes(form.watch("type") ?? "") && (
                    <div className="flex justify-between">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="config.mode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row space-x-4">
                              <div className="w-2/3">
                                <FormLabel>Mode</FormLabel>
                                <FormDescription>
                                  Charge for metered usage by
                                </FormDescription>
                                <div className="text-xs font-normal leading-snug">
                                  Different modes of charging for metered usage
                                </div>
                              </div>
                              <div className="flex w-1/3 flex-col items-center space-y-1">
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value ?? ""}
                                >
                                  <FormControl className="truncate">
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TIER_MODES.map((mode) => (
                                      <SelectItem key={mode} value={mode}>
                                        {
                                          TIER_MODES_MAP?.[
                                            mode as keyof typeof TIER_MODES_MAP
                                          ].label
                                        }
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <FormMessage className="self-start px-2" />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <Separator />

                  {["tiered", "volume"].includes(form.watch("type") ?? "") && (
                    <div>
                      <div className="mb-4 flex justify-between">
                        <h4 className="my-auto block">Tiers</h4>
                      </div>

                      {fields.length > 0 ? (
                        <div className="px-2 py-2">
                          {fields.map((field, index) => (
                            <div
                              key={index}
                              className="flex items-end justify-between gap-2"
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
                                  name={`config.tiers.${index}.first`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel
                                        className={cn(index !== 0 && "sr-only")}
                                      >
                                        <Tooltip>
                                          <div className="flex items-center gap-2 text-sm font-normal">
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
                                            Slug is important to identify your
                                            feature.
                                            <TooltipArrow className="fill-background-bg" />
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>
                                      <FormControl>
                                        <Input {...field} className="h-8" />
                                      </FormControl>
                                      <FormMessage className="text-xs font-light" />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="w-full">
                                <FormField
                                  control={form.control}
                                  key={field.id}
                                  name={`config.tiers.${index}.last`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel
                                        className={cn(index !== 0 && "sr-only")}
                                      >
                                        <Tooltip>
                                          <div className="flex items-center gap-2 text-sm font-normal">
                                            Last Unit
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
                                            If the usage is less than the tier
                                            up to value, then the flat price is
                                            charged.
                                            <TooltipArrow className="fill-background-bg" />
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>
                                      <FormControl>
                                        <Input {...field} className="h-8" />
                                      </FormControl>
                                      <FormMessage className="text-xs font-light" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="w-full">
                                <FormField
                                  control={form.control}
                                  key={field.id}
                                  name={`config.tiers.${index}.price`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel
                                        className={cn(index !== 0 && "sr-only")}
                                      >
                                        <Tooltip>
                                          <div className="flex items-center gap-2 text-sm font-normal">
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
                                            Price per unit for this tier.
                                            <TooltipArrow className="fill-background-bg" />
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <DollarSignIcon className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            {...field}
                                            className="h-8 pl-8"
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage className="text-xs font-light" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div>
                                {index !== fields.length - 1 ? (
                                  <Button
                                    variant="ghost"
                                    size={"icon"}
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      remove(index)
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span className="sr-only">delete tier</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size={"icon"}
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      append({
                                        first: 0,
                                        price: 0,
                                        last: 0,
                                      })
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span className="sr-only">add tier</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
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
                  className="flex items-center gap-2 text-xs font-normal"
                >
                  <Switch id="mute" aria-label="Don't show" /> Hide this from
                  preview page
                </Label>
                <Button
                  type="submit"
                  form="feature-config-form"
                  size="sm"
                  className="ml-auto"
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
