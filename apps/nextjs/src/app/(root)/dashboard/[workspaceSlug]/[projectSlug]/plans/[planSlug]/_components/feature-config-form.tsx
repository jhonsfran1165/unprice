"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import {
  FEATURE_TYPES,
  FEATURE_TYPES_MAPS,
  TIER_MODES,
  TIER_MODES_MAP,
  USAGE_MODES,
  USAGE_MODES_MAP,
} from "@unprice/db/utils"
import type { PlanVersion, PlanVersionFeature } from "@unprice/db/validators"
import { planVersionFeatureInsertBaseSchema } from "@unprice/db/validators"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { Separator } from "@unprice/ui/separator"
import { Switch } from "@unprice/ui/switch"
import { cn } from "@unprice/ui/utils"

import { Warning } from "@unprice/ui/icons"
import { Tooltip, TooltipContent, TooltipTrigger } from "@unprice/ui/tooltip"
import { Typography } from "@unprice/ui/typography"
import { SubmitButton } from "~/components/submit-button"
import { useEntitlement } from "~/hooks/use-entitlement"
import { usePlanFeaturesList } from "~/hooks/use-features"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"
import { BannerPublishedVersion } from "../[planVersionId]/_components/banner"
import { FlatFormFields } from "./flat-form-fields"
import { PackageFormFields } from "./package-form-fields"
import { TierFormFields } from "./tier-form-fields"
import { UsageFormFields } from "./usage-form-fields"

export function FeatureConfigForm({
  setDialogOpen,
  defaultValues,
  planVersion,
  className,
}: {
  defaultValues: PlanVersionFeature
  planVersion: PlanVersion | null
  setDialogOpen?: (open: boolean) => void
  className?: string
}) {
  const router = useRouter()
  const [_planFeatureList, setPlanFeatureList] = usePlanFeaturesList()

  const editMode = !!defaultValues.id
  const isPublished = planVersion?.status === "published"
  const { access: isProAccess } = useEntitlement("access-pro")

  // we set all possible values for the form so react-hook-form don't complain
  const controlledDefaultValues = {
    ...defaultValues,
    config: {
      ...defaultValues.config,
      tiers: defaultValues.config?.tiers ?? [
        {
          firstUnit: 1,
          lastUnit: null,
          unitPrice: {
            displayAmount: "0.00",
            dinero: {
              amount: 0,
              currency: {
                code: planVersion?.currency ?? "USD",
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
                code: planVersion?.currency ?? "USD",
                base: 10,
                exponent: 2,
              },
              scale: 2,
            },
          },
        },
      ],
      usageMode: defaultValues.config?.usageMode ?? "tier",
      tierMode: defaultValues.config?.tierMode ?? "volume",
      units: defaultValues.config?.units ?? 1,
    },
    metadata: {
      realtime: defaultValues?.metadata?.realtime ?? false,
    },
  }

  const form = useZodForm({
    schema: planVersionFeatureInsertBaseSchema,
    defaultValues: controlledDefaultValues,
  })

  const updatePlanVersionFeatures = api.planVersionFeatures.update.useMutation({
    onSuccess: ({ planVersionFeature }) => {
      // update the feature list
      setPlanFeatureList((features) => {
        const index = features.findIndex(
          (feature) => feature.featureId === planVersionFeature.featureId
        )

        features[index] = planVersionFeature

        return features
      })

      form.reset(planVersionFeature)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  // reset form values when feature changes
  useEffect(() => {
    form.reset(controlledDefaultValues)
  }, [defaultValues.id])

  // subscribe to type changes for conditional rendering in the forms
  const featureType = form.watch("featureType")
  const usageMode = form.watch("config.usageMode")

  const onSubmitForm = async (data: PlanVersionFeature) => {
    if (defaultValues.id) {
      await updatePlanVersionFeatures.mutateAsync({
        ...data,
        id: defaultValues.id,
      })
    }
  }

  // TODO: add error handling here
  if (!planVersion) {
    return null
  }

  return (
    <Form {...form}>
      <form
        id={"feature-config-form"}
        className={cn("space-y-4", className)}
        onSubmit={form.handleSubmit(onSubmitForm)}
      >
        {planVersion.status === "published" && <BannerPublishedVersion />}

        <FormField
          control={form.control}
          name="hidden"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="font-semibold text-sm">Hide this feature from UI</FormLabel>
                <FormDescription className="font-normal text-sm">
                  When enabled, this feature will not be visible in pricing pages.
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

        <FormField
          control={form.control}
          name="metadata.realtime"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="font-semibold text-sm">Report usage in realtime</FormLabel>
                <FormDescription className="font-normal text-sm">
                  When enabled, the usage is synced immediately to the analytics. By default usage
                  is update every 5 minutes. Use this if you need to ensure limits are not exceeded.
                </FormDescription>
              </div>
              <FormControl>
                {!isProAccess ? (
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={isPublished}
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center rounded-full p-2 text-muted-foreground">
                        <Warning className="h-8 w-8" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent align="start" side="bottom" sideOffset={10} alignOffset={-5}>
                      <div className="flex max-w-[200px] flex-col gap-4 py-2">
                        <Typography variant="p" className="text-center">
                          You don't have access to this feature
                        </Typography>
                        <Button variant="primary" size="sm" className="mx-auto w-2/3">
                          Upgrade
                        </Button>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </FormControl>
            </FormItem>
          )}
        />

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="items-center rounded-md border-1">
            <div className="space-y-2">
              <div className="rounded-md bg-background-bg p-2 text-center font-semibold shadow-sm">
                Pricing Model
              </div>
              <div className="line-clamp-3 space-y-2 break-all text-justify font-normal text-xs leading-snug">
                All units price based on final tier reached. Needs a record for Stripe to track
                customer service usage.
              </div>
              <div className="flex flex-col gap-1">
                <FormField
                  control={form.control}
                  name="featureType"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormMessage className="self-start" />
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                        }}
                        value={field.value ?? ""}
                      >
                        <FormControl className="truncate">
                          <SelectTrigger
                            className="items-start [&_[data-description]]:hidden"
                            disabled={isPublished}
                          >
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FEATURE_TYPES.map((type) => (
                            <SelectItem value={type} key={type}>
                              <div className="flex items-start gap-3">
                                <div className="grid gap-0.5">
                                  <p>{FEATURE_TYPES_MAPS[type].label}</p>
                                  <p className="text-xs" data-description>
                                    {FEATURE_TYPES_MAPS[type].description}
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

                {featureType === "usage" && (
                  <FormField
                    control={form.control}
                    name="config.usageMode"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormMessage className="self-start px-2" />
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl className="truncate">
                            <SelectTrigger
                              className="items-start [&_[data-description]]:hidden"
                              disabled={isPublished}
                            >
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {USAGE_MODES.map((mode) => (
                              <SelectItem value={mode} key={mode}>
                                <div className="flex items-start gap-3">
                                  <div className="grid gap-0.5">
                                    <p>{USAGE_MODES_MAP[mode].label}</p>
                                    <p className="text-xs" data-description>
                                      {USAGE_MODES_MAP[mode].description}
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

                {(featureType === "tier" || (featureType === "usage" && usageMode === "tier")) && (
                  <FormField
                    control={form.control}
                    name="config.tierMode"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormMessage className="self-start px-2" />
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl className="truncate">
                            <SelectTrigger
                              className="items-start [&_[data-description]]:hidden"
                              disabled={isPublished}
                            >
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIER_MODES.map((mode) => (
                              <SelectItem value={mode} key={mode}>
                                <div className="flex items-start gap-3">
                                  <div className="grid gap-0.5">
                                    <p>{TIER_MODES_MAP[mode].label}</p>
                                    <p className="text-xs" data-description>
                                      {TIER_MODES_MAP[mode].description}
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

        {featureType === "flat" && (
          <FlatFormFields form={form} currency={planVersion.currency} isDisabled={isPublished} />
        )}

        {featureType === "package" && (
          <PackageFormFields form={form} currency={planVersion.currency} isDisabled={isPublished} />
        )}

        {featureType === "usage" && (
          <UsageFormFields form={form} currency={planVersion.currency} isDisabled={isPublished} />
        )}

        {featureType === "tier" && (
          <TierFormFields form={form} currency={planVersion.currency} isDisabled={isPublished} />
        )}

        {planVersion.status !== "published" && (
          <div className="flex justify-end space-x-4">
            <div className="mt-8 flex flex-col">
              <div className="flex justify-end gap-4">
                <Button
                  variant={"link"}
                  onClick={(e) => {
                    e.preventDefault()
                    setDialogOpen?.(false)
                  }}
                >
                  Cancel
                </Button>
                <SubmitButton
                  isSubmitting={form.formState.isSubmitting}
                  isDisabled={form.formState.isSubmitting}
                  label={editMode ? "Update" : "Create"}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}
