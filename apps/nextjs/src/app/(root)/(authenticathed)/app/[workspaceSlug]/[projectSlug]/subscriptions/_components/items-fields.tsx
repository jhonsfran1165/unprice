"use client"

import { HelpCircle, LayoutGrid } from "lucide-react"
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form"

import type { RouterOutputs } from "@builderai/api"
import type { InsertSubscription } from "@builderai/db/validators"
import {
  configFlatSchema,
  configTierSchema,
  configUsageSchema,
} from "@builderai/db/validators"
import {
  FormControl,
  FormField,
  FormItem,
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
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@builderai/ui/tooltip"

import { EmptyPlaceholder } from "~/components/empty-placeholder"

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

  const { fields, append, remove, replace } = items

  selectedPlanVersion?.planFeatures.forEach((feature) => {
    versionFeatures.set(feature.id, feature)
  })

  const calculateTotal = (id: string, quantity: number) => {
    const feature = versionFeatures?.get(id)

    if (!feature) {
      // toastAction("error", `feature with ${id} not found`)

      return {
        text: "n/a",
        billingPeriod: null,
        usageMode: null,
        units: null,
        price: null,
      }
    }

    const billingPeriod = selectedPlanVersion?.billingPeriod

    switch (feature.featureType) {
      case "usage": {
        const { tiers, usageMode, units, price } = configUsageSchema.parse(
          feature.config
        )

        if (usageMode === "tier" && tiers && tiers.length > 0) {
          let remaining = quantity // make a copy, so we don't mutate the original
          let total = 0

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
              total += quantityCalculation * Number.parseFloat(tier.unitPrice)
            }
            if (tier.flatPrice) {
              total += Number.parseFloat(tier.flatPrice)
            }
          }

          return {
            text: `starts at $${total.toFixed(2)}/${billingPeriod}`,
            billingPeriod,
            usageMode,
            units,
            price,
          }
        }

        if (usageMode === "unit" && price) {
          return {
            text: `starts at $${(Number.parseFloat(price) * quantity).toFixed(2)}/${billingPeriod}`,
            billingPeriod,
            usageMode,
            units,
            price,
          }
        }

        if (usageMode === "package" && units && price) {
          // round up to the next package
          const packageCount = Math.ceil(quantity / units)

          return {
            text: `starts at $${(Number.parseFloat(price) * packageCount).toFixed(2)}/${billingPeriod}`,
            billingPeriod,
            usageMode,
            units,
            price,
          }
        }

        return {
          text: `starts at $${price ?? 0}/${billingPeriod}`,
          billingPeriod,
          usageMode,
          units,
          price,
        }
      }
      case "flat": {
        const { price } = configFlatSchema.parse(feature.config)
        const priceInCents = Math.floor(parseFloat(price)).toFixed(2)

        return {
          text: `$${Math.floor(parseFloat(priceInCents) * quantity).toFixed(2)}/${billingPeriod}`,
          billingPeriod,
          usageMode: null,
          units: null,
          price: priceInCents,
        }
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
          return {
            text: "n/a",
            billingPeriod: null,
            usageMode: null,
            units: null,
            price: null,
          }
        }

        let totalPrice = 0

        if (tier.unitPrice) {
          totalPrice = quantity * Number.parseFloat(tier.unitPrice)
        }

        if (tier.flatPrice) {
          totalPrice += Number.parseFloat(tier.flatPrice)
        }

        return {
          text: `$${totalPrice.toFixed(2)}/${billingPeriod}`,
          billingPeriod,
          usageMode: null,
          units: null,
          price: tier.unitPrice,
          flatPrice: tier.flatPrice,
        }
      }
      default:
        return {
          text: "n/a",
          billingPeriod: null,
          usageMode: null,
          units: null,
          price: null,
        }
    }
  }

  console.log("form", form.formState.errors)

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex flex-col">
        <h4 className="my-auto block font-semibold">Items configuration</h4>
        <div className="text-xs font-normal leading-snug">
          {form.getValues("type") === "addons"
            ? "Configure the tiers for the feature, the price will be calculated with the reported usage"
            : "Configure the tiers for the feature, the price will be calculated when the subscription is created."}
        </div>
      </div>

      <div className="flex items-center justify-center px-2 py-4">
        {fields.length > 0 ? (
          <Table>
            <TableHeader className="border-b border-t">
              <TableRow className="pointer-events-none">
                <TableHead className="h-10 px-0">Item</TableHead>
                <TableHead className="h-10 px-0 text-center">
                  Quantity
                </TableHead>
                <TableHead className="h-10 pr-0 text-end">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((item, index) => {
                const featureData = versionFeatures.get(item.itemId)

                const pricePerFeature = calculateTotal(
                  item.itemId,
                  form.getValues(`items.${index}.quantity`) ?? 0
                )

                let billingText = "n/a"

                if (featureData?.featureType === "flat") {
                  billingText = `${selectedPlanVersion?.currency}$${pricePerFeature.price}/${pricePerFeature.billingPeriod}`
                } else if (featureData?.featureType === "tier") {
                  billingText = `${selectedPlanVersion?.currency}$${pricePerFeature.flatPrice} + ${pricePerFeature.price} per unit per ${pricePerFeature.billingPeriod}`
                } else if (featureData?.featureType === "usage") {
                  if (pricePerFeature.usageMode === "unit") {
                    billingText = `${selectedPlanVersion?.currency}$${pricePerFeature.price} per unit per ${pricePerFeature.billingPeriod}`
                  }
                  if (pricePerFeature.usageMode === "package") {
                    billingText = `${selectedPlanVersion?.currency}$${pricePerFeature.price} per ${pricePerFeature.units} units per ${pricePerFeature.billingPeriod}`
                  }
                  if (pricePerFeature.usageMode === "tier") {
                    billingText = `${selectedPlanVersion?.currency}$${pricePerFeature.price} per ${pricePerFeature.units} units per ${pricePerFeature.billingPeriod}`
                  }

                  billingText = `${selectedPlanVersion?.currency}$${pricePerFeature.price} per ${pricePerFeature.units} units per ${pricePerFeature.billingPeriod}`
                } else {
                  billingText = "n/a"
                }

                if (!featureData) {
                  return null
                }

                return (
                  <TableRow
                    key={item.id}
                    className="border-b hover:bg-transparent"
                  >
                    <TableCell className="px-0">
                      <Tooltip>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.slug}</span>
                          <span>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 font-light" />
                            </TooltipTrigger>
                          </span>
                        </div>

                        <TooltipContent
                          className="w-36 bg-background-bg text-xs font-normal"
                          align="center"
                          side="right"
                        >
                          <ul className="list-inside list-disc">
                            <li>type: {item.itemType}</li>
                            <li>limit: {item?.limit ?? "n/a"}</li>
                            {featureData.featureType === "flat" && (
                              <li>{`quantity for flat feature don't change`}</li>
                            )}
                          </ul>
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                      <div className="hidden text-xs text-muted-foreground md:block">
                        {featureData.featureType} rate
                      </div>
                      <div className="hidden text-xs italic text-muted-foreground md:inline">
                        {billingText}
                      </div>
                    </TableCell>
                    <TableCell className="table-cell">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="justify-center text-center">
                            <FormMessage className="text-xs font-light" />
                            {/* // TODO: depending on the feature quantity should be disabled */}
                            <FormControl>
                              <div className="flex flex-col gap-1">
                                <Input
                                  {...field}
                                  className="mx-auto h-8 w-20"
                                  disabled={featureData?.featureType === "flat"}
                                />
                                <div className="text-xs font-light">
                                  limit: {item?.limit ?? "n/a"}
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="pr-0 text-end text-xs">
                      {pricePerFeature.text}
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
