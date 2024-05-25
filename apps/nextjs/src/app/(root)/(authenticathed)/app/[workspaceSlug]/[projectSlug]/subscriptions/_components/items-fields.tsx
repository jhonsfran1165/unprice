"use client"

import { useState } from "react"
import { LayoutGrid, Trash2, X } from "lucide-react"
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form"

import type { RouterOutputs } from "@builderai/api"
import type { InsertSubscription } from "@builderai/db/validators"
import { calculatePricePerFeature } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
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

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { toastAction } from "~/lib/toast"

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

  const [isDelete, setConfirmDelete] = useState<Record<number, boolean>>(
    Object.fromEntries(fields.map((_, i) => [i, false]))
  )

  selectedPlanVersion?.planFeatures.forEach((feature) => {
    versionFeatures.set(feature.id, feature)
  })

  console.log("form", form.formState.errors)

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex flex-col">
        <h4 className="my-auto block font-semibold">Feature configuration</h4>
        <div className="text-xs font-normal leading-snug">
          {form.getValues("type") === "addons"
            ? "Configure the tiers for the feature, the price will be calculated with the reported usage"
            : "Configure the quantity for each feature, the price will be calculated with the reported usage. You can't change the quantity for flat features. If you want to exclude a feature, just delete it."}
        </div>
      </div>

      <div className="flex items-center justify-center px-2 py-4">
        {fields.length > 0 ? (
          <Table>
            <TableHeader className="border-b border-t">
              <TableRow className="pointer-events-none">
                <TableHead className="h-10 px-0">Features</TableHead>
                <TableHead className="h-10 px-0 text-center">
                  Quantity
                </TableHead>
                <TableHead className="h-10 pr-0 text-end">
                  Estimated Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((item, index) => {
                const featureData = versionFeatures.get(item.itemId)

                if (!featureData || !selectedPlanVersion) {
                  return null
                }

                const { err, val: pricePerFeature } = calculatePricePerFeature({
                  feature: featureData,
                  quantity: form.getValues(`items.${index}.quantity`) ?? 0,
                  planVersion: selectedPlanVersion,
                })

                if (err) {
                  toastAction("error", err.message)
                  return null
                }

                return (
                  <TableRow
                    key={item.id}
                    className="border-b hover:bg-transparent"
                  >
                    <TableCell className="px-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{item.slug}</span>
                        <div className="flex- w-20 flex-row gap-1">
                          {isDelete[index] && (
                            <div className="flex flex-row items-center">
                              <Button
                                className="px-0"
                                variant="link"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()

                                  setConfirmDelete((prev) => {
                                    return { ...prev, [index]: false }
                                  })
                                  remove(index)
                                }}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">
                                  Confirm delete feature
                                </span>
                              </Button>
                              <Button
                                className="px-0 text-xs font-light"
                                variant="link"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  setConfirmDelete((prev) => {
                                    return { ...prev, [index]: false }
                                  })
                                }}
                              >
                                cancel
                                <span className="sr-only">
                                  cancel delete from plan
                                </span>
                              </Button>
                            </div>
                          )}
                          {!isDelete[index] && (
                            <Button
                              className="px-0"
                              variant="link"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()

                                setConfirmDelete((prev) => {
                                  return { ...prev, [index]: true }
                                })
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Delete from plan</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="hidden text-xs text-muted-foreground md:block">
                        {pricePerFeature.usageMode
                          ? `${featureData.featureType} rate per
                        ${pricePerFeature.usageMode}`
                          : `${featureData.featureType} rate`}
                      </div>
                      <div className="hidden text-xs italic text-muted-foreground md:inline">
                        {pricePerFeature.unitPriceText}
                      </div>
                    </TableCell>
                    <TableCell className="table-cell">
                      {featureData.featureType === "usage" ? (
                        <div className="text-center">Varies</div>
                      ) : featureData.featureType === "flat" ? (
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
                                      featureData?.featureType === "flat" ||
                                      featureData?.featureType === "usage"
                                    }
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </TableCell>
                    <TableCell className="pr-0 text-end text-xs">
                      {pricePerFeature.totalPriceText}
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
