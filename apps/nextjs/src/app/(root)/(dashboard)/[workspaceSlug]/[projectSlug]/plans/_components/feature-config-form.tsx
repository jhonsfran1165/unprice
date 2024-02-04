import { useState } from "react"
import Link from "next/link"
import { useFieldArray } from "react-hook-form"

import { FEATURE_TYPES } from "@builderai/db/schema/enums"
import type { FeaturePlan } from "@builderai/db/schema/price"
import { featurePlanSchema, TIER_MODES } from "@builderai/db/schema/price"
import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import {
  DollarSignIcon,
  HelpCircle,
  Plus,
  Settings,
  XCircle,
} from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { Separator } from "@builderai/ui/separator"
import { Textarea } from "@builderai/ui/text-area"
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@builderai/ui/tooltip"
import { cn } from "@builderai/ui/utils"

import { Ping } from "~/components/ping"
import { useZodForm } from "~/lib/zod-form"

export function FeatureConfigForm({
  projectSlug,
  feature,
  onSubmit,
}: {
  projectSlug: string
  feature: FeaturePlan
  onSubmit: (feature: FeaturePlan) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const defaultConfig =
    feature.type === "flat"
      ? {
          price: 0,
          divider: 0,
        }
      : feature.type === "metered"
      ? {
          mode: "tiered",
          divider: 0,
          tiers: [{ up: 0, price: 0, flat: 0 }],
        }
      : {
          price: 0,
          divider: 0,
        }

  const defaultValues = {
    projectSlug: projectSlug,
    config: feature.config ?? defaultConfig,
  }

  const form = useZodForm({
    schema: featurePlanSchema,
    defaultValues: {
      ...feature,
      ...defaultValues,
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.tiers",
  })

  const hasConfig = Object.keys(feature?.config ?? {}).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={"icon"} className="relative h-8 w-8">
          {!hasConfig && (
            <div className="absolute right-0 top-0">
              <Ping variant={"destructive"} />
            </div>
          )}
          <Settings className="h-4 w-4" />
          <span className="sr-only">configure</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="feature-config" className="space-y-6">
            <div className="flex justify-between gap-2">
              <div className="w-full">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Title for your feature"
                          disabled
                          readOnly
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
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Slug"
                          readOnly
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Feature Type</FormLabel>
                    <Link
                      prefetch={false}
                      href="/pricing"
                      target="_blank"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      What&apos;s included in each plan?
                    </Link>
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    value={feature?.type ?? ""}
                    disabled
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FEATURE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          <span className="font-medium">{type}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {feature.type === "flat" && (
              <div className="flex justify-between gap-2">
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="config.price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Tooltip>
                            <div className="flex items-center gap-2">
                              Price
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
                              Slug is important to identify your feature.
                              <TooltipArrow className="fill-background-bg" />
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSignIcon className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-8" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="config.divider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Tooltip>
                            <div className="flex items-center gap-2">
                              Divider
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
                              Slug is important to identify your feature.
                              <TooltipArrow className="fill-background-bg" />
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {feature.type === "metered" && (
              <>
                <div className="flex justify-between gap-2">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="config.mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Tooltip>
                              <div className="flex items-center gap-2">
                                Mode
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
                                Slug is important to identify your feature.
                                <TooltipArrow className="fill-background-bg" />
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIER_MODES.map((mode) => (
                                <SelectItem key={mode} value={mode}>
                                  <span className="font-medium">{mode}</span>
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
                      name="config.divider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Tooltip>
                              <div className="flex items-center gap-2">
                                Divider
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
                                Slug is important to identify your feature.
                                <TooltipArrow className="fill-background-bg" />
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-4 flex justify-between">
                    <h4 className="my-auto block">Tiers</h4>
                  </div>

                  {fields.length > 0 ? (
                    <ScrollArea className="h-28">
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
                                name={`config.tiers.${index}.up`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel
                                      className={cn(index !== 0 && "sr-only")}
                                    >
                                      <Tooltip>
                                        <div className="flex items-center gap-2 text-sm font-normal">
                                          Up to
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
                                name={`config.tiers.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel
                                      className={cn(index !== 0 && "sr-only")}
                                    >
                                      <Tooltip>
                                        <div className="flex items-center gap-2 text-sm font-normal">
                                          Price
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
                            <div className="w-full">
                              <FormField
                                control={form.control}
                                key={field.id}
                                name={`config.tiers.${index}.flat`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel
                                      className={cn(index !== 0 && "sr-only")}
                                    >
                                      <Tooltip>
                                        <div className="flex items-center gap-2 text-sm font-normal">
                                          Flat price
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
                                      up: 0,
                                      price: 0,
                                      flat: 0,
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
                    </ScrollArea>
                  ) : null}
                </div>

                <Separator />
              </>
            )}

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
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="config-feature"
            disabled={form.formState.isSubmitting}
            onClick={async (e) => {
              e.preventDefault()

              await form.handleSubmit((data: FeaturePlan) => {
                onSubmit(data)
                setIsOpen(false)
              })()
            }}
          >
            {form.formState.isSubmitting && (
              <div className="mr-2" role="status">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              </div>
            )}
            {"Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
