"use client"

import { useCallback, useState } from "react"
import { EyeIcon, EyeOff, LayoutGrid, Trash2, X } from "lucide-react"
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form"

import type { RouterOutputs } from "@builderai/api"
import type { InsertSubscription } from "@builderai/db/validators"
import { calculatePricePerFeature } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Input } from "@builderai/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@builderai/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@builderai/ui/tooltip"

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { PropagationStopper } from "~/components/prevent-propagation"
import { FeatureConfigForm } from "../../plans/[planSlug]/_components/feature-config-form"

type PlanVersionResponse =
  RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]

type PlanVersionFeaturesResponse =
  RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]["planFeatures"][0]

export default function ConfigItemsFormField({
  form,
  selectedPlanVersion,
  items,
}: {
  form: UseFormReturn<InsertSubscription>
  selectedPlanVersion?: PlanVersionResponse
  items: UseFieldArrayReturn<InsertSubscription, "items", "id">
}) {
  const versionFeatures = new Map<string, PlanVersionFeaturesResponse>()
  const versionAddons = new Map<string, PlanVersionFeaturesResponse>()
  const { fields } = items

  const [isDelete, setConfirmDelete] = useState<Map<string, boolean>>(
    new Map<string, boolean>(
      fields.map((item) => [item.id, false] as [string, boolean])
    )
  )

  // TODO: use later for addons support
  const isSubscriptionTypeAddons = false

  selectedPlanVersion?.planFeatures.forEach((feature) => {
    versionFeatures.set(feature.id, feature)
    versionAddons.set(feature.id, feature)
  })

  const { errors } = form.formState

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex flex-col gap-2">
        <FormLabel
          className={cn({
            "text-destructive": errors.items,
          })}
        >
          <h4 className="my-auto block font-semibold">Feature configuration</h4>
        </FormLabel>

        <div className="text-xs font-normal leading-snug">
          {
            "Configure the quantity for each feature, for usage based feature, the price will be calculated with the reported usage. You can't change the quantity for flat features"
          }
        </div>
        {errors.items && <FormMessage>{errors.items.message}</FormMessage>}
      </div>

      <div className="flex items-center justify-center px-2 py-4">
        {fields.length > 0 ? (
          <Table>
            <TableHeader className="border-b border-t">
              <TableRow className="pointer-events-none">
                <TableHead className="h-10 pl-1">Features</TableHead>
                <TableHead className="h-10 px-0 text-center">
                  Quantity Units
                </TableHead>
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
                const feature =
                  versionFeatures.get(item.itemId) ??
                  versionAddons.get(item.itemId)!

                const quantity = form.watch(`items.${index}.quantity`)

                return (
                  <TableRow
                    key={item.id}
                    className="border-b hover:bg-transparent"
                  >
                    <TableCell className="pl-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{item.slug}</span>
                        <PropagationStopper>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                className="h-4 w-4"
                                variant="link"
                                size="icon"
                              >
                                {feature.hidden ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <EyeIcon className="h-3 w-3" />
                                )}
                                <span className="sr-only">View feature</span>
                              </Button>
                            </DialogTrigger>

                            <DialogContent className="flex max-h-[800px] w-full flex-col justify-between overflow-y-scroll md:w-1/2 lg:w-[600px]">
                              <DialogHeader>
                                <DialogTitle>
                                  Feature: {feature.feature.title}
                                </DialogTitle>
                              </DialogHeader>
                              {feature.feature?.description && (
                                <DialogDescription>
                                  {feature.feature.description}
                                </DialogDescription>
                              )}
                              <FeatureConfigForm
                                defaultValues={feature}
                                planVersion={selectedPlanVersion!}
                                className="my-6"
                              />
                            </DialogContent>
                          </Dialog>
                        </PropagationStopper>
                      </div>

                      <div className="text-muted-foreground hidden text-xs md:block">
                        {feature.config?.usageMode
                          ? `${feature.featureType} rate per
                      ${feature.config.usageMode}`
                          : `${feature.featureType} rate`}
                      </div>
                      <ConfigItemPrice
                        selectedPlanVersion={selectedPlanVersion!}
                        quantity={quantity}
                        feature={feature}
                        type="unit"
                      />
                    </TableCell>
                    <TableCell className="table-cell">
                      {feature.featureType === "usage" ? (
                        <div className="text-center">Varies</div>
                      ) : ["flat", "package"].includes(feature.featureType) ? (
                        <div className="text-center">{item.quantity}</div>
                      ) : (
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="justify-center text-center">
                              <FormMessage className="text-xs font-light" />
                              {/* // TODO: depending on the feature quantity should be disabled */}
                              <FormControl>
                                <div className="flex flex-col">
                                  <Input
                                    {...field}
                                    className="mx-auto h-8 w-20"
                                    disabled={
                                      feature.featureType === "flat" ||
                                      feature.featureType === "usage"
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
                        quantity={quantity}
                        feature={feature}
                        type="total"
                      />
                      {isSubscriptionTypeAddons &&
                        isDelete.get(item.itemId) && (
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
                                  (prev) =>
                                    new Map(prev.set(item.itemId, false))
                                )
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      {isSubscriptionTypeAddons &&
                        !isDelete.get(item.itemId) && (
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
                                    (prev) =>
                                      new Map(prev.set(item.itemId, true))
                                  )

                                  // set timeout to reset the delete confirmation
                                  setTimeout(() => {
                                    setConfirmDelete(
                                      (prev) =>
                                        new Map(prev.set(item.itemId, false))
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
          <div className="flex w-full items-center justify-center px-2 py-4">
            <EmptyPlaceholder>
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
  quantity?: number
  type: "total" | "unit"
}) {
  // useCallback to prevent re-rendering calculatePricePerFeature
  const calculatePrice = useCallback(() => {
    return calculatePricePerFeature({
      feature: feature,
      quantity,
    })
  }, [feature, quantity])

  const { err, val: pricePerFeature } = calculatePrice()

  if (err) {
    return (
      <div className="text-muted-foreground inline text-xs italic">
        provide quantity
      </div>
    )
  }

  if (type === "total") {
    return (
      <div className="inline text-end text-xs">
        {pricePerFeature?.totalPrice.displayAmount &&
          `${pricePerFeature.totalPrice.displayAmount}/ ${selectedPlanVersion.billingPeriod}`}
      </div>
    )
  }

  return (
    <div className="text-muted-foreground inline text-xs italic">
      {pricePerFeature?.unitPrice.displayAmount &&
        `${pricePerFeature.unitPrice.displayAmount}/ ${selectedPlanVersion?.billingPeriod}`}
    </div>
  )
}
