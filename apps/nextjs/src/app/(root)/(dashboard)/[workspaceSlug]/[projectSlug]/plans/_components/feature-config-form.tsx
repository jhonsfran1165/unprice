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
import { Plus, Settings, XCircle } from "@builderai/ui/icons"
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
import { cn } from "@builderai/ui/utils"

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={"icon"} className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">configure</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="config-feature"
            onSubmit={form.handleSubmit((data: FeaturePlan) => {
              onSubmit(data)
              setIsOpen(false)
            })}
            className="space-y-6"
          >
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
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
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
                        <FormLabel>Divider</FormLabel>
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
                          <FormLabel>Mode</FormLabel>
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
                          <FormLabel>Divider</FormLabel>
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
                      <div className="px-2">
                        {fields.map((field, index) => (
                          <div
                            key={index}
                            className="flex justify-between gap-2"
                          >
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
                                      Up to
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
                                      Price per unit
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
                                name={`config.tiers.${index}.flat`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel
                                      className={cn(index !== 0 && "sr-only")}
                                    >
                                      Flat Price
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          {...field}
                                          className="h-8 w-3/4"
                                        />
                                        {index !== fields.length - 1 ? (
                                          <Button
                                            variant="ghost"
                                            size={"icon"}
                                            className="absolute right-0 top-0 h-8 w-8 text-muted-foreground"
                                            onClick={() => {
                                              remove(index)
                                            }}
                                          >
                                            <XCircle className="h-4 w-4" />
                                            <span className="sr-only">
                                              delete tier
                                            </span>
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size={"icon"}
                                            className="absolute right-0 top-0 h-8 w-8 text-muted-foreground"
                                            onClick={() =>
                                              append({
                                                up: 0,
                                                price: 0,
                                                flat: 0,
                                              })
                                            }
                                          >
                                            <Plus className="h-4 w-4" />
                                            <span className="sr-only">
                                              add tier
                                            </span>
                                          </Button>
                                        )}
                                      </div>
                                    </FormControl>
                                    <FormMessage className="text-xs font-light" />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : null}
                </div>
              </>
            )}

            <Separator />

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
            type="submit"
            disabled={form.formState.isSubmitting}
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
