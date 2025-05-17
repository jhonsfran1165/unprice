"use client"
import { getBillingCycleMessage } from "@unprice/db/validators"
import type { RouterOutputs } from "@unprice/trpc"
import { Badge } from "@unprice/ui/badge"
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

interface FormValues extends FieldValues {
  planVersionId?: string
}

export default function SelectPlanFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
  planVersions,
  isLoading,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
  planVersions: RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"]
  isLoading?: boolean
}) {
  const [switcherCustomerOpen, setSwitcherCustomerOpen] = useState(false)
  const selectedPlanVersionId = form.watch("planVersionId" as FieldPath<TFieldValues>)

  const selectedPlanVersion = planVersions.find((version) => version.id === selectedPlanVersionId)

  const noData = planVersions.length === 0 || planVersions.length === undefined

  return (
    <FormField
      control={form.control}
      name={"planVersionId" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Plan Version</FormLabel>
          <FormDescription>
            Select the plan version to create the subscription phase. Only plan versions that are
            published and active are shown.
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
                    {isLoading ? (
                      <LoadingAnimation className="h-4 w-4" variant="dots" />
                    ) : selectedPlanVersion ? (
                      `${selectedPlanVersion.plan.slug} v${selectedPlanVersion.version} - ${selectedPlanVersion.title} - ${selectedPlanVersion.billingConfig.name}`
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
                        {planVersions.map((version) => (
                          <CommandItem
                            value={`${version.plan.slug} v${version.version} - ${version.title} - ${version.billingConfig.name}`}
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
                            {`${version.plan.slug} v${version.version} - ${version.title} - ${version.billingConfig.name}`}
                          </CommandItem>
                        ))}
                        {noData && !isLoading && (
                          <CommandItem disabled className="w-full justify-center">
                            No plan versions found
                          </CommandItem>
                        )}
                      </div>
                    </CommandGroup>
                  </FilterScroll>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedPlanVersion && (
            <div className="text-muted-foreground text-sm">
              Plan version:{" "}
              <b>
                {selectedPlanVersion.plan.slug} v{selectedPlanVersion.version} -{" "}
                {getBillingCycleMessage(selectedPlanVersion.billingConfig).message}{" "}
              </b>
              {selectedPlanVersion.paymentMethodRequired && (
                <Badge variant="outline">payment method required</Badge>
              )}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
