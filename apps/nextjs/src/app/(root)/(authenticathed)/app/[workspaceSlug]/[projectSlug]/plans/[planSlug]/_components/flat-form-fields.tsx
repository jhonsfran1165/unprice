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
                    {form.getValues("currency")}
                  </div>
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
