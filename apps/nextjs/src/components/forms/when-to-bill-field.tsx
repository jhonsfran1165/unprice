"use client"

import { WHEN_TO_BILLING } from "@unprice/db/utils"
import type { WhenToBill } from "@unprice/db/validators"
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

interface FormValues extends FieldValues {
  whenToBill?: WhenToBill | null
}

export default function WhenToBillFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={"whenToBill" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel>When to bill</FormLabel>
          <FormDescription>Billing at the start or end of the cycle?</FormDescription>
          <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isDisabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select when to bill" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {WHEN_TO_BILLING.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
