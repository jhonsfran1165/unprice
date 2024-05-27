"use client"

import { EyeIcon, LayoutGrid } from "lucide-react"
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form"

import type { RouterOutputs } from "@builderai/api"
import type { InsertSubscription } from "@builderai/db/validators"
import { calculatePricePerFeature } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
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

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { PropagationStopper } from "~/components/prevent-propagation"
import { toastAction } from "~/lib/toast"
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
  const { fields } = items

  selectedPlanVersion?.planFeatures.forEach((feature) => {
    versionFeatures.set(feature.id, feature)
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
                  Quantity
                </TableHead>
                <TableHead className="h-10 pr-1 text-end">
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
                    <TableCell className="pl-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{item.slug}</span>
                        <PropagationStopper>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                className="w-4"
                                variant="link"
                                size="icon"
                              >
                                <EyeIcon className="h-3 w-3" />
                                <span className="sr-only">View feature</span>
                              </Button>
                            </DialogTrigger>

                            <DialogContent className="flex max-h-[800px] w-full flex-col justify-between overflow-y-scroll md:w-1/2 lg:w-[600px]">
                              <DialogHeader>
                                <DialogTitle>
                                  Plan Version Feature Details
                                </DialogTitle>
                              </DialogHeader>
                              <FeatureConfigForm
                                defaultValues={featureData}
                                planVersion={selectedPlanVersion}
                              />
                            </DialogContent>
                          </Dialog>
                        </PropagationStopper>
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
                    <TableCell className="pr-1 text-end text-xs">
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
