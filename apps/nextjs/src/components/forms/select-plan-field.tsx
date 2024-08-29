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
import { Popover, PopoverContent, PopoverTrigger } from "@unprice/ui/popover"
import { cn } from "@unprice/ui/utils"
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"

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
import { api } from "~/trpc/client"

type PlanVersion = RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]

interface FormValues extends FieldValues {
  planVersionId?: string
}

export default function SelectPlanFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
  isChangePlanSubscription,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
  isChangePlanSubscription?: boolean
}) {
  const [switcherCustomerOpen, setSwitcherCustomerOpen] = useState(false)
  const [selectedPlanVersion, setSelectedPlanVersion] = useState<PlanVersion>()

  const { data, isLoading } = api.planVersions.listByActiveProject.useQuery(
    {
      published: true,
      active: true,
      enterprisePlan: true,
    },
    {
      refetchOnWindowFocus: false,
      enabled: isDisabled, // only fetch plans when dialog is open
    }
  )

  const noData = data?.planVersions.length === 0 || data?.planVersions.length === undefined

  return (
    <FormField
      control={form.control}
      name={"planVersionId" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{isChangePlanSubscription ? "Current Plan" : "Plan Version"}</FormLabel>
          <FormDescription>
            {isChangePlanSubscription
              ? "Current plan version this customer is subscribed to"
              : "Select the plan version to create the subscription"}
          </FormDescription>
          {!isChangePlanSubscription ? (
            <div className="font-normal text-xs leading-snug">
              All the items will be configured based on the plan version selected.
            </div>
          ) : null}
          <Popover
            modal={true}
            open={switcherCustomerOpen}
            onOpenChange={() => {
              if (isDisabled || isChangePlanSubscription) return
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
                      `${selectedPlanVersion.plan.slug} v${selectedPlanVersion.version} - ${selectedPlanVersion.title} - ${selectedPlanVersion.billingPeriod}`
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
                            value={`${version.plan.slug} v${version.version} - ${version.title} - ${version.billingPeriod}`}
                            key={version.id}
                            onSelect={() => {
                              field.onChange(version.id)
                              setSwitcherCustomerOpen(false)
                              setSelectedPlanVersion(version)
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                version.id === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {`${version.plan.slug} v${version.version} - ${version.title} - ${version.billingPeriod}`}
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
