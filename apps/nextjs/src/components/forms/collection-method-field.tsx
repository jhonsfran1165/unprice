"use client"
import { COLLECTION_METHODS } from "@unprice/db/utils"
import type { CollectionMethod } from "@unprice/db/validators"
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
  collectionMethod?: CollectionMethod | null
}

export default function CollectionMethodFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={"collectionMethod" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel>Collection Method</FormLabel>
          <FormDescription>
            Whether the subscription will be billed automatically or via invoice.
          </FormDescription>
          <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isDisabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select collection method" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {COLLECTION_METHODS.map((type) => (
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
