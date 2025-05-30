"use client"
import { Button } from "@unprice/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@unprice/ui/command"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@unprice/ui/popover"
import { cn } from "@unprice/ui/utils"
import { CheckIcon, ChevronDown } from "lucide-react"
import { useState } from "react"
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { FilterScroll } from "~/components/filter-scroll"
import { TIMEZONES } from "~/lib/timezones"

interface FormValues extends FieldValues {
  timezone?: string
}

export default function TimeZoneFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
  isLoading,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
  isLoading?: boolean
}) {
  const [switcherCustomerOpen, setSwitcherCustomerOpen] = useState(false)

  return (
    <FormField
      control={form.control}
      name={"timezone" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Timezone</FormLabel>
          <FormDescription>
            Subscriptions will use this timezone for all its invoices.
          </FormDescription>
          <Popover
            modal={true}
            open={switcherCustomerOpen}
            onOpenChange={() => {
              if (isDisabled) return
              setSwitcherCustomerOpen(!switcherCustomerOpen)
            }}
          >
            <PopoverTrigger asChild>
              <div className="">
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    // biome-ignore lint/a11y/useSemanticElements: <explanation>
                    role="combobox"
                    disabled={isDisabled}
                    className={cn("w-full justify-between")}
                  >
                    {field.value}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </div>
            </PopoverTrigger>
            <PopoverContent className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search a timezone..." />
                <CommandList className="overflow-hidden">
                  <CommandEmpty>No timezone found.</CommandEmpty>
                  <FilterScroll>
                    <CommandGroup>
                      {isLoading && <CommandLoading>Loading...</CommandLoading>}
                      <div className="flex flex-col gap-2 pt-1">
                        {TIMEZONES.map((timezone) => (
                          <CommandItem
                            value={timezone.tzCode}
                            key={timezone.tzCode}
                            onSelect={() => {
                              field.onChange(timezone.tzCode)
                              setSwitcherCustomerOpen(false)
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                timezone.tzCode === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {`${timezone.label}`}
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>
                  </FilterScroll>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
