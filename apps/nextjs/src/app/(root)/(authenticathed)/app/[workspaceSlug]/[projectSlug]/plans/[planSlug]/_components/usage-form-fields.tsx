"use client"

import { DollarSignIcon } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

import {
  AGGREGATION_METHODS,
  AGGREGATION_METHODS_MAP,
} from "@builderai/db/utils"
import type { PlanVersionFeature } from "@builderai/db/validators"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Input } from "@builderai/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"

export function UsageFormFields({
  form,
}: {
  form: UseFormReturn<PlanVersionFeature>
}) {
  return (
    <div className="flex flex-col space-y-6">
      {form.getValues("config.usageMode") === "unit" && (
        <div className="flex w-full justify-between">
          <FormField
            control={form.control}
            name="config.price"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel>Price</FormLabel>
                <FormDescription>
                  Price of the feature in the selected currency of the plan
                  (USD)
                </FormDescription>
                <div className="text-xs font-normal leading-snug">
                  This is the flat price of the feature over the period of the
                  plan. eg 100 usd per month. Price of 0 means the feature is
                  free.
                </div>

                <div className="flex flex-col items-center space-y-1 px-2">
                  <FormControl className="w-full">
                    <div className="flex flex-row items-center">
                      <div className="relative flex-1">
                        <DollarSignIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input {...field} className="rounded-e-none pl-8" />
                      </div>
                      <div
                        className={
                          "inline-flex h-9 items-center justify-center rounded-e-md rounded-s-none border border-l-0 bg-background-bg px-3 text-sm font-medium"
                        }
                      >
                        {form.formState.defaultValues?.currency}
                      </div>
                    </div>
                  </FormControl>

                  <FormMessage className="self-start px-2" />
                </div>
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="flex justify-between">
        <div className="w-full">
          <FormField
            control={form.control}
            name="config.aggregationMethod"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <div className="">
                  <FormLabel>Aggreation Method</FormLabel>
                  <FormDescription>Charge for metered usage by</FormDescription>
                  <div className="text-xs font-normal leading-snug">
                    Different modes of charging for metered usage
                  </div>
                </div>
                <div className="px-2">
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
                      {AGGREGATION_METHODS.map((mode, index) => (
                        <SelectItem value={mode} key={index}>
                          <div className="flex items-start gap-3 text-muted-foreground">
                            <div className="grid gap-0.5">
                              <p>
                                {
                                  AGGREGATION_METHODS_MAP[
                                    mode as keyof typeof AGGREGATION_METHODS_MAP
                                  ].label
                                }
                              </p>
                              <p className="text-xs" data-description>
                                {
                                  AGGREGATION_METHODS_MAP[
                                    mode as keyof typeof AGGREGATION_METHODS_MAP
                                  ].description
                                }
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}
