"use client"
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
  autoRenew?: boolean
}

export default function AutoRenewFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={"autoRenew" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel>Auto Renew</FormLabel>
          <FormDescription>If the subscription should be auto renewed.</FormDescription>
          <Select
            onValueChange={(value) => field.onChange(value === "true")}
            value={field.value?.toString() ?? "true"}
            disabled={isDisabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder="Select if the subscription should be auto renewed"
                  defaultValue={field.value?.toString() ?? "true"}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
