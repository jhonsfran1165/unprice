"use client"

import { EyeIcon, EyeOff, LayoutGrid, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  type ArrayPath,
  type FieldArray,
  type FieldArrayPath,
  type FieldArrayWithId,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
  useFieldArray,
} from "react-hook-form"

import type { RouterOutputs } from "@unprice/api"
import type { SubscriptionItemConfig } from "@unprice/db/validators"
import {
  calculateFreeUnits,
  calculatePricePerFeature,
  createDefaultSubscriptionConfig,
} from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@unprice/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@unprice/ui/tooltip"
import { Typography } from "@unprice/ui/typography"
import { cn } from "@unprice/ui/utils"
import { isZero } from "dinero.js"
import { FeatureConfigForm } from "~/app/(root)/dashboard/[workspaceSlug]/[projectSlug]/plans/[planSlug]/_components/feature-config-form"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { PropagationStopper } from "~/components/prevent-propagation"
import { nFormatter } from "~/lib/nformatter"
import { api } from "~/trpc/client"

type PlanVersionResponse = RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]

type PlanVersionFeaturesResponse =
  RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]["planFeatures"][0]

interface FormValues extends FieldValues {
  config?: SubscriptionItemConfig[]
  planVersionId: string
  nextPlanVersionId?: string
  items?: SubscriptionItemConfig[]
}

export default function ConfigItemsFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
  isChangePlanSubscription,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
  isChangePlanSubscription?: boolean
}) {
  const [selectedPlanVersion, setSelectedPlanVersion] = useState<PlanVersionResponse | undefined>()
  const [selectedNewPlanVersion, setSelectedNewPlanVersion] = useState<
    PlanVersionResponse | undefined
  >()

  const planVersionId = form.watch("planVersionId" as FieldPath<TFieldValues>)
  const nextPlanVersionId = form.watch("nextPlanVersionId" as FieldPath<TFieldValues>)
  const itemsSubs = form.watch("items" as FieldPath<TFieldValues>)

  // TODO: use later for addons support
  const isSubscriptionTypeAddons = false

  const { data, isLoading } = api.planVersions.listByActiveProject.useQuery({
    enterprisePlan: true,
    published: true,
    active: !isDisabled && !isChangePlanSubscription,
  })

  const items = useFieldArray({
    control: form.control,
    name: "config" as FieldArrayPath<TFieldValues>,
  })

  type ConfigFieldName<T> = "config" extends ArrayPath<T> ? "config" : never

  const fields = items.fields as FieldArrayWithId<
    TFieldValues,
    ConfigFieldName<TFieldValues>,
    "id"
  >[]

  useEffect(() => {
    if (planVersionId) {
      const planVersion = data?.planVersions.find((version) => version.id === planVersionId)
      setSelectedPlanVersion(planVersion)
    }

    if (nextPlanVersionId) {
      const newPlanVersion = data?.planVersions.find((version) => version.id === nextPlanVersionId)
      setSelectedNewPlanVersion(newPlanVersion)
    }
  }, [isLoading, planVersionId, nextPlanVersionId])

  useEffect(() => {
    if (!isChangePlanSubscription && selectedPlanVersion) {
      const { err, val: itemsConfig } = createDefaultSubscriptionConfig({
        planVersion: selectedPlanVersion,
        items: itemsSubs,
      })

      if (err) {
        console.error(err)
        return
      }

      items.replace(itemsConfig as FieldArray<TFieldValues, ArrayPath<TFieldValues>>[])
    }

    if (isChangePlanSubscription && selectedNewPlanVersion) {
      const { err, val: itemsConfig } = createDefaultSubscriptionConfig({
        planVersion: selectedNewPlanVersion,
        items: itemsSubs,
      })

      if (err) {
        console.error(err)
        return
      }

      items.replace(itemsConfig as FieldArray<TFieldValues, ArrayPath<TFieldValues>>[])
    }
  }, [selectedPlanVersion?.id, selectedNewPlanVersion?.id])

  const { versionFeatures, versionAddons } = useMemo(() => {
    const features = new Map<string, PlanVersionFeaturesResponse>()
    const addons = new Map<string, PlanVersionFeaturesResponse>()

    selectedPlanVersion?.planFeatures.forEach((feature) => {
      features.set(feature.id, feature)
      addons.set(feature.id, feature)
    })

    return { versionFeatures: features, versionAddons: addons }
  }, [selectedPlanVersion])

  const [isDelete, setConfirmDelete] = useState<Map<string, boolean>>(
    new Map<string, boolean>(fields.map((item) => [item.id, false] as [string, boolean]))
  )

  const { errors } = form.formState

  const getErrorMessage = (
    errors: FieldErrors<TFieldValues>,
    field: string
  ): string | undefined => {
    const error = errors[field as keyof typeof errors]
    return error && typeof error === "object" && "message" in error
      ? (error.message as string)
      : undefined
  }

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex flex-col gap-2">
        <FormLabel
          className={cn({
            "text-destructive": errors.config,
          })}
        >
          <Typography variant="h4" className="my-auto block">
            Features configuration
          </Typography>
        </FormLabel>

        <div className="font-normal text-xs leading-snug">
          {
            "Configure the quantity for each feature, for usage based feature, the price will be calculated with the reported usage. You can't change the quantity for flat features"
          }
        </div>
        {errors.config && <FormMessage>{getErrorMessage(errors, "config")}</FormMessage>}
      </div>

      <div className="flex items-center justify-center px-2 py-2">
        {fields.length > 0 ? (
          <Table>
            <TableHeader className="border-t border-b">
              <TableRow className="pointer-events-none">
                <TableHead className="h-10 pl-1">Features</TableHead>
                <TableHead className="h-10 px-0 text-center">Quantity Units</TableHead>
                <TableHead
                  className={cn("h-10 text-end", {
                    "pr-1": !isSubscriptionTypeAddons,
                    "pr-8": isSubscriptionTypeAddons,
                  })}
                >
                  Estimated Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((item, index) => {
                const itemConfig = item as unknown as SubscriptionItemConfig & { id: string }

                const feature =
                  versionFeatures.get(itemConfig.featurePlanId) ??
                  versionAddons.get(itemConfig.featurePlanId)

                if (!feature) return null

                // if the units are not set, use the minimum units
                const units =
                  form.watch(`config.${index}.units` as FieldPath<TFieldValues>) || itemConfig.min

                const freeUnits = calculateFreeUnits({ feature })
                const freeUnitsText =
                  freeUnits === Number.POSITIVE_INFINITY
                    ? feature.limit
                      ? `Up to ${nFormatter(feature.limit)}`
                      : "Unlimited"
                    : freeUnits === 0
                      ? ""
                      : nFormatter(freeUnits)

                return (
                  <TableRow key={item.id} className="border-b hover:bg-transparent">
                    <TableCell className="pl-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{itemConfig.featureSlug}</span>
                        <PropagationStopper>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="h-4 w-4" variant="link" size="icon">
                                {feature.hidden ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <EyeIcon className="h-3 w-3" />
                                )}
                                <span className="sr-only">View feature</span>
                              </Button>
                            </DialogTrigger>

                            <DialogContent className="flex max-h-[800px] w-full flex-col justify-between overflow-y-scroll lg:w-[600px] md:w-1/2">
                              <DialogHeader>
                                <DialogTitle>Feature: {feature.feature.title}</DialogTitle>
                              </DialogHeader>
                              <DialogDescription>
                                {feature.feature.description ?? ""}
                              </DialogDescription>
                              <FeatureConfigForm
                                defaultValues={feature}
                                planVersion={selectedPlanVersion!}
                                className="my-6"
                              />
                            </DialogContent>
                          </Dialog>
                        </PropagationStopper>
                      </div>

                      <div className="hidden text-muted-foreground text-xs md:block">
                        {feature.config?.usageMode
                          ? `${feature.featureType} rate per
                      ${feature.config.usageMode}`
                          : `${feature.featureType} rate`}
                      </div>
                      <ConfigItemPrice
                        selectedPlanVersion={selectedPlanVersion!}
                        quantity={units ?? 0}
                        feature={feature}
                        type="unit"
                      />
                    </TableCell>
                    <TableCell className="table-cell">
                      {feature.featureType === "usage" ? (
                        <div className="text-center">{freeUnitsText}</div>
                      ) : feature.featureType === "flat" ? (
                        <div className="text-center">{itemConfig.units}</div>
                      ) : (
                        <FormField
                          control={form.control}
                          name={`config.${index}.units` as FieldPath<TFieldValues>}
                          render={({ field }) => (
                            <FormItem className="justify-center text-center">
                              <FormMessage className="font-light text-xs" />
                              <FormControl>
                                <div className="flex flex-col">
                                  <Input
                                    {...field}
                                    className="mx-auto h-8 w-20"
                                    disabled={
                                      feature.featureType === "flat" ||
                                      feature.featureType === "usage" ||
                                      isDisabled
                                    }
                                    value={field.value ?? ""}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </TableCell>
                    <TableCell className="flex h-24 items-center justify-end gap-1 pr-1">
                      <ConfigItemPrice
                        selectedPlanVersion={selectedPlanVersion!}
                        quantity={units ?? 0}
                        feature={feature}
                        type="total"
                      />
                      {isSubscriptionTypeAddons && isDelete.get(itemConfig.featurePlanId) && (
                        <div className="flex flex-row items-center">
                          <Button
                            className="px-0"
                            variant="link"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              items.remove(index)

                              setConfirmDelete(
                                (prev) => new Map(prev.set(itemConfig.featurePlanId, false))
                              )
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {isSubscriptionTypeAddons && !isDelete.get(itemConfig.featurePlanId) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="px-0"
                              variant="link"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                setConfirmDelete(
                                  (prev) => new Map(prev.set(itemConfig.featurePlanId, true))
                                )

                                setTimeout(() => {
                                  setConfirmDelete(
                                    (prev) => new Map(prev.set(itemConfig.featurePlanId, false))
                                  )
                                }, 2000)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-[200px] text-sm">
                              remove this addon from the subscription
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex w-full items-center justify-center px-2 py-2">
            <EmptyPlaceholder isLoading={isLoading} className="min-h-[200px]">
              <EmptyPlaceholder.Icon>
                <LayoutGrid className="h-8 w-8" />
              </EmptyPlaceholder.Icon>
              <EmptyPlaceholder.Title>No plan selected</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Select a plan to configure the items
              </EmptyPlaceholder.Description>
            </EmptyPlaceholder>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfigItemPrice({
  selectedPlanVersion,
  quantity,
  feature,
  type,
}: {
  selectedPlanVersion: PlanVersionResponse
  feature: PlanVersionFeaturesResponse
  quantity: number
  type: "total" | "unit"
}) {
  // useCallback to prevent re-rendering calculatePricePerFeature
  const calculatePrice = useCallback(() => {
    return calculatePricePerFeature({
      feature: feature,
      quantity: quantity,
    })
  }, [feature, quantity])

  const { err, val: pricePerFeature } = calculatePrice()

  if (err) {
    return <div className="inline text-muted-foreground text-xs italic">provide quantity</div>
  }

  if (type === "total") {
    return (
      <div className="inline text-end text-xs">
        {pricePerFeature?.totalPrice.displayAmount &&
          `${pricePerFeature.totalPrice.displayAmount}/ ${selectedPlanVersion.billingPeriod}`}
      </div>
    )
  }

  // if the price is 0, don't show the price
  return (
    <>
      {!isZero(pricePerFeature.unitPrice.dinero) && (
        <div className="inline text-muted-foreground text-xs italic">
          {pricePerFeature.unitPrice.displayAmount &&
            `${pricePerFeature.unitPrice.displayAmount}/ ${selectedPlanVersion?.billingPeriod}`}
        </div>
      )}
    </>
  )
}
