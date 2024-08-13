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

type PlanVersionResponse = RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]

export default function PlanNewVersionFormField({
  form,
  isDisabled,
  isLoading,
  planVersions,
  selectedPlanVersion,
  setSelectedPlanVersion,
}: {
  form: UseFormReturn<InsertSubscription>
  isDisabled?: boolean
  isLoading?: boolean
  planVersions: PlanVersionResponse[]
  selectedPlanVersion?: PlanVersionResponse
  setSelectedPlanVersion: (planVersion: PlanVersionResponse) => void
}) {
  const [switcherPlanOpen, setSwitcherPlanOpen] = useState(false)

  return (
    <FormField
      control={form.control}
      name="nextPlanVersionTo"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>New Plan Version</FormLabel>
          <FormDescription>Select the plan version to create the new subscription</FormDescription>
          <div className="font-normal text-xs leading-snug">
            All the items will be configured based on this plan version.
          </div>
          <Popover
            modal={true}
            open={switcherPlanOpen}
            onOpenChange={() => {
              if (isDisabled) return
              setSwitcherPlanOpen(!switcherPlanOpen)
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
                <CommandList>
                  <CommandEmpty>No plan found.</CommandEmpty>
                  <FilterScroll>
                    <CommandGroup>
                      {isLoading && <CommandLoading>Loading...</CommandLoading>}
                      <div className="flex flex-col gap-2 pt-1">
                        {planVersions.map((version) => (
                          <CommandItem
                            value={`${version.plan.slug} v${version.version} - ${version.title} - ${version.billingPeriod}`}
                            key={version.id}
                            onSelect={() => {
                              field.onChange(version.id)
                              setSwitcherPlanOpen(false)
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
