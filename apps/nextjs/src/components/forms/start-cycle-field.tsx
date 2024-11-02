"use client"

import type { BillingPeriod, StartCycle } from "@unprice/db/validators"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { FilterScroll } from "~/components/filter-scroll"

interface FormValues extends FieldValues {
  startCycle?: StartCycle | null
  billingPeriod?: BillingPeriod | null
}

const getStartCycleOptions = (billingPeriod?: BillingPeriod | null) => {
  if (billingPeriod === "month") {
    return [...Array.from({ length: 31 }, (_, i) => i + 1)]
  }

  if (billingPeriod === "year") {
    return [...Array.from({ length: 12 }, (_, i) => i + 1)]
  }

  return []
}

export default function StartCycleFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
  billingPeriod,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
  billingPeriod?: BillingPeriod | null
}) {
  const providedBillingPeriod =
    billingPeriod ?? form.watch("phases.0.billingPeriod" as FieldPath<TFieldValues>)

  const startCycles = getStartCycleOptions(providedBillingPeriod)

  return (
    <FormField
      control={form.control}
      name={"phases.0.startCycle" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel>Pricing Cycle Start Date</FormLabel>
          <FormDescription>
            The day the subscription will be billed and start a new cycle.
          </FormDescription>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString() ?? ""}
            disabled={isDisabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a start of billing cycle" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <FilterScroll>
                {startCycles.map((cycle) => (
                  <SelectItem value={cycle.toString()} key={cycle}>
                    {cycle}
                  </SelectItem>
                ))}
              </FilterScroll>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
