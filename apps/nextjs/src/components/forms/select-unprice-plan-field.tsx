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
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { Popover, PopoverContent, PopoverTrigger } from "@unprice/ui/popover"
import { cn } from "@unprice/ui/utils"
import { CheckIcon, ChevronDown } from "lucide-react"
import { useState } from "react"
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { FilterScroll } from "~/components/filter-scroll"
import { api } from "~/trpc/client"

interface FormValues extends FieldValues {
  planVersionId?: string
  nextPlanVersionId?: string | null
}

export default function SelectUnpricePlanFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
  isNextPlanVersionId,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
  isNextPlanVersionId?: boolean
}) {
  const [switcherCustomerOpen, setSwitcherCustomerOpen] = useState(false)
  const projectId = form.getValues("projectId" as FieldPath<TFieldValues>)
  const selectedPlanVersionId = isNextPlanVersionId
    ? form.watch("nextPlanVersionId" as FieldPath<TFieldValues>)
    : form.watch("planVersionId" as FieldPath<TFieldValues>)

  const { data, isLoading } = api.planVersions.listByUnpriceProject.useQuery(
    {
      published: true,
      active: true,
      enterprisePlan: true,
      projectId,
      latest: true,
    },
    {
      refetchOnWindowFocus: false,
      enabled: isDisabled, // only fetch plans when dialog is open
    }
  )

  const selectedPlanVersion = data?.planVersions.find(
    (version) => version.id === selectedPlanVersionId
  )

  const noData = data?.planVersions.length === 0 || data?.planVersions.length === undefined

  return (
    <FormField
      control={form.control}
      name={
        isNextPlanVersionId
          ? ("nextPlanVersionId" as FieldPath<TFieldValues>)
          : ("planVersionId" as FieldPath<TFieldValues>)
      }
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Select plan</FormLabel>
          <FormDescription>Select the plan to create/change the subscription</FormDescription>
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
                    ) : selectedPlanVersion ? (
                      `${selectedPlanVersion.title} - ${selectedPlanVersion.billingPeriod} ${
                        selectedPlanVersion.trialDays > 0
                          ? `- ${selectedPlanVersion.trialDays} days trial`
                          : ""
                      }`
                    ) : (
                      "Select plan"
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
                  <CommandEmpty>No plan found.</CommandEmpty>
                  <FilterScroll>
                    <CommandGroup>
                      {isLoading && <CommandLoading>Loading...</CommandLoading>}
                      <div className="flex flex-col gap-2 pt-1">
                        {data?.planVersions.map((version) => (
                          <CommandItem
                            value={`${version.title} - ${version.billingPeriod}`}
                            key={version.id}
                            onSelect={() => {
                              field.onChange(version.id)
                              setSwitcherCustomerOpen(false)
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                version.id === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {`${version.title} - ${version.billingPeriod} ${
                              version.trialDays > 0 ? `- ${version.trialDays} days trial` : ""
                            }`}
                          </CommandItem>
                        ))}
                        {noData && !isLoading && (
                          <CommandItem disabled className="w-full justify-center">
                            No data provided
                          </CommandItem>
                        )}
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
