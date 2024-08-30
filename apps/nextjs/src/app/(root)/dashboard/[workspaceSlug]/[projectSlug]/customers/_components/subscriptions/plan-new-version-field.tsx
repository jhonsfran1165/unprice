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
import { FilterScroll } from "~/components/filter-scroll"
import { api } from "~/trpc/client"

export default function PlanNewVersionFormField({
  form,
  isDisabled,
  isChangePlanSubscription,
}: {
  form: UseFormReturn<InsertSubscription>
  isDisabled?: boolean
  isChangePlanSubscription?: boolean
}) {
  const [switcherPlanOpen, setSwitcherPlanOpen] = useState(false)
  const selectedNextPlanVersionId = form.watch("nextPlanVersionId")

  const { data, isLoading } = api.planVersions.listByActiveProject.useQuery({
    enterprisePlan: true,
    published: true,
    // we want to query inactive plans as well because it might be the case that the user is still subscribed to a legacy plan
    active: !isChangePlanSubscription && !isDisabled,
  })

  const selectedNextPlanVersion = data?.planVersions.find(
    (version) => version.id === selectedNextPlanVersionId
  )

  return (
    <FormField
      control={form.control}
      name="nextPlanVersionId"
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
                    ) : selectedNextPlanVersion ? (
                      `${selectedNextPlanVersion.plan.slug} v${selectedNextPlanVersion.version} - ${selectedNextPlanVersion.title} - ${selectedNextPlanVersion.billingPeriod}`
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
                              setSwitcherPlanOpen(false)
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
