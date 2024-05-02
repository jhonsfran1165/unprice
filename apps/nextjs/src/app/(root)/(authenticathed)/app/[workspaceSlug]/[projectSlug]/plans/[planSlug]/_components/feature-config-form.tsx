"use client"

import { useEffect } from "react"

import {
  FEATURE_TYPES,
  FEATURE_TYPES_MAPS,
  TIER_MODES,
  TIER_MODES_MAP,
  USAGE_MODES,
  USAGE_MODES_MAP,
} from "@builderai/db/utils"
import type { PlanVersionFeature } from "@builderai/db/validators"
import { planVersionFeatureSchema } from "@builderai/db/validators"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@builderai/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { Separator } from "@builderai/ui/separator"

import { useZodForm } from "~/lib/zod-form"
import {
  useActiveFeature,
  usePlanActiveTab,
  usePlanFeaturesList,
} from "../../_components/use-features"
import { FlatFormFields } from "./flat-form-fields"
import { TierFormFields } from "./tier-form-fields"

export function FeatureConfigForm({
  feature,
  formId,
}: {
  feature: PlanVersionFeature
  formId: string
}) {
  // TODO: decide if we need to use this!
  const [planActiveTab] = usePlanActiveTab()
  const [_planFeatures, setPlanFeatures] = usePlanFeaturesList()
  const [_, setActiveFeature] = useActiveFeature()

  const form = useZodForm({
    schema: planVersionFeatureSchema,
    defaultValues: feature,
  })

  // reset form values when feature changes
  useEffect(() => {
    form.reset({
      ...feature,
      config: {
        ...feature.config,
        tiers: feature.config?.tiers ?? [
          {
            firstUnit: 0,
            lastUnit: Infinity,
            unitPrice: 0,
            flatPrice: 0,
          },
        ],
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature.id])

  // // set form dirty state so we can show a warning when user tries to leave the page
  // useEffect(() => {
  //   if (form.formState.isDirty) {
  //   }
  // }, [form.formState.isDirty])

  // subscribe to type changes for conditional rendering in the forms
  const type = form.watch("type")

  const onSubmitForm = (data: PlanVersionFeature) => {
    setActiveFeature(data)

    setPlanFeatures((features) => {
      const activeFeatures = features[planActiveTab]
      const index = activeFeatures.findIndex((f) => f.id === data.id)

      activeFeatures[index] = data
      return {
        ...features,
        [planActiveTab]: activeFeatures,
      }
    })

    // TODO: save here
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmitForm)}
      >
        <div className="flex flex-col gap-2">
          <div className="border-1 items-center rounded-md">
            <div className="space-y-2">
              <div className="rounded-md bg-background-bg p-2 text-center font-semibold shadow-sm">
                Pricing Model
              </div>
              <div className="line-clamp-3 space-y-2 break-all px-2 text-justify text-xs font-normal leading-snug text-muted-foreground">
                All units price based on final tier reached. Needs a record for
                Stripe to track customer service usage.
              </div>
              <div className="flex flex-col gap-1  px-2">
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
                                  <p className="text-xs" data-description>
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
                                    <p className="text-xs" data-description>
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
                                    <p className="text-xs" data-description>
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

        {type === "flat" && <FlatFormFields form={form} />}

        {type === "tier" && <TierFormFields form={form} />}
      </form>
    </Form>
  )
}
