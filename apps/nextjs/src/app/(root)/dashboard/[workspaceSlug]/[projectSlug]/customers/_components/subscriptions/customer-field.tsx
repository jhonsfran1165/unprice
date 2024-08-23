"use client"
import type { UseFormReturn } from "react-hook-form"

import type { InsertSubscription } from "@unprice/db/validators"
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
import { Popover, PopoverContent, PopoverTrigger } from "@unprice/ui/popover"
import { cn } from "@unprice/ui/utils"

import type { RouterOutputs } from "@unprice/api"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { CheckIcon, ChevronDown } from "lucide-react"
import { useState } from "react"
import { FilterScroll } from "~/components/filter-scroll"

type Customer = RouterOutputs["customers"]["listByActiveProject"]["customers"][0]

export default function CustomerFormField({
  form,
  isDisabled,
  isLoading,
  customers,
  selectedCustomer,
  setSelectedCustomer,
}: {
  form: UseFormReturn<InsertSubscription>
  isDisabled?: boolean
  isLoading?: boolean
  customers: Customer[]
  selectedCustomer?: Customer
  setSelectedCustomer: (customer: Customer) => void
}) {
  const [switcherCustomerOpen, setSwitcherCustomerOpen] = useState(false)

  return (
    <FormField
      control={form.control}
      name="customerId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Customer</FormLabel>
          <FormDescription>Select the customer to create the subscription</FormDescription>
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
                    role="combobox"
                    disabled={isDisabled}
                    className={cn("w-full justify-between")}
                  >
                    {isLoading ? (
                      <LoadingAnimation className="h-4 w-4" variant="dots" />
                    ) : selectedCustomer ? (
                      `${selectedCustomer.email}`
                    ) : (
                      "Select customer"
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </div>
            </PopoverTrigger>
            <PopoverContent className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search a plan..." />
                <CommandList className="overflow-hidden">
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <FilterScroll>
                    <CommandGroup>
                      {isLoading && <CommandLoading>Loading...</CommandLoading>}
                      <div className="flex flex-col gap-2 pt-1">
                        {customers.map((customer) => (
                          <CommandItem
                            value={`${customer.email}`}
                            key={customer.id}
                            onSelect={() => {
                              field.onChange(customer.id)
                              setSwitcherCustomerOpen(false)
                              setSelectedCustomer(customer)
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                customer.id === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {`${customer.email}`}
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
