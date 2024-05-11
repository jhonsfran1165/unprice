"use client"

import { DollarSignIcon } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

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

export function FlatFormFields({
  form,
}: {
  form: UseFormReturn<PlanVersionFeature>
}) {
  return (
    <div className="flex flex-col">
      <FormField
        control={form.control}
        name="config.price"
        render={({ field }) => (
          <FormItem className="">
            <FormLabel>Price</FormLabel>
            <FormDescription>
              Price of the feature in the selected currency of the plan (USD)
            </FormDescription>
            <div className="text-xs font-normal leading-snug">
              This is the flat price of the feature over the period of the plan.
              eg 100 usd per month. Price of 0 means the feature is free.
            </div>

            <div className="flex flex-col items-center space-y-1 px-2">
              <FormControl className="w-full">
                <div className="relative">
                  <DollarSignIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input {...field} className="pl-8" />
                </div>
              </FormControl>

              <FormMessage className="self-start px-2" />
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}
