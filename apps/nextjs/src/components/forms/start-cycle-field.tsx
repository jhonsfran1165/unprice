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
    billingPeriod ?? form.getValues("billingPeriod" as FieldPath<TFieldValues>)

  const validaStartCyclePerBillingPerido = (billingPeriod?: BillingPeriod | null) => {
    if (billingPeriod === "month") {
      return [...Array.from({ length: 31 }, (_, i) => (i + 1).toString()), "last_day_of_month"]
    }

    if (billingPeriod === "year") {
      return [...Array.from({ length: 12 }, (_, i) => (i + 1).toString())]
    }

    return []
  }

  const startCycles = validaStartCyclePerBillingPerido(providedBillingPeriod)

  return (
    <FormField
      control={form.control}
      name={"startCycle" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel>Pricing Cycle Start Date</FormLabel>
          <FormDescription>
            The day the customer will be billed. Which means receiving an invoice.
          </FormDescription>
          <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isDisabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a start of billing cycle" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <FilterScroll>
                {startCycles.map((cycle) => (
                  <SelectItem value={cycle} key={cycle}>
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
