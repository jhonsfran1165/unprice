"use client"

import type { Page } from "@unprice/db/validators"
import { Badge } from "@unprice/ui/badge"
import { Button } from "@unprice/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { Checkbox } from "@unprice/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
import { Skeleton } from "@unprice/ui/skeleton"
import { Calculator } from "lucide-react"
import { Plus, Search, X } from "lucide-react"
import { useState } from "react"
import type { Control, UseFormGetValues, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { api } from "~/trpc/client"
import { FilterScroll } from "../filter-scroll"

interface PlanSelectionProps {
  control: Control<Page>
  setValue: UseFormSetValue<Page>
  getValues: UseFormGetValues<Page>
  watch: UseFormWatch<Page>
}

export function PlanSelection({ control, setValue, watch }: PlanSelectionProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = api.planVersions.listByActiveProject.useQuery(
    {
      onlyPublished: true,
    },
    {
      enabled: true,
    }
  )

  const selectedPlans = watch("selectedPlans")

  const handlePlanSelection = (planVersionId: string) => {
    const isSelected = selectedPlans.some((plan) => plan.id === planVersionId)

    if (isSelected) {
      removePlan(planVersionId)
      return
    }

    const planVersion = data?.planVersions.find((plan) => plan.id === planVersionId)

    if (!planVersion) {
      return
    }

    const updatedPlans = [
      ...selectedPlans.filter((version) => version.id !== planVersionId),
      {
        id: planVersionId,
        slug: planVersion.plan.slug,
        version: planVersion.version,
        description: planVersion.plan.description,
      },
    ]

    setValue("selectedPlans", updatedPlans)
  }

  const removePlan = (planVersionId: string) => {
    setValue(
      "selectedPlans",
      selectedPlans.filter((plan) => plan.id !== planVersionId)
    )
  }

  const filteredPlans = data?.planVersions.filter((planVersion) => {
    const query = searchQuery.toLowerCase()
    return (
      planVersion.plan.slug.toLowerCase().includes(query) ||
      planVersion.version.toString().includes(query) ||
      planVersion.plan.description.toLowerCase().includes(query)
    )
  })

  const categories = [...new Set(data?.planVersions.map((planVersion) => planVersion.plan.slug))]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Plans Selection
        </CardTitle>
        <CardDescription>
          Choose which plans to display on your page. The plans will be displayed in the order you
          select them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="selectedPlans"
          render={() => (
            <FormItem>
              <FormLabel>Available Plans</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {/* Plan Search Combobox */}
                  <div className="space-y-2">
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          disabled={isLoading}
                        >
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            <span className="line-clamp-1 text-left">
                              Search plans by name, version, or description...
                            </span>
                          </div>
                          <Plus className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search plans..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList className="max-h-60">
                            <CommandEmpty>No plans found.</CommandEmpty>
                            <FilterScroll>
                              {categories.map((category) => {
                                const categoryPlans = filteredPlans?.filter(
                                  (plan) => plan.plan.slug === category
                                )
                                if (categoryPlans?.length === 0) return null

                                return (
                                  <CommandGroup key={category} heading={category}>
                                    {categoryPlans?.map((planVersion) => (
                                      <CommandItem
                                        key={planVersion.id}
                                        value={`${planVersion.plan.slug} v${planVersion.version}`}
                                        onSelect={() => {
                                          handlePlanSelection(planVersion.id)
                                        }}
                                        className="flex items-start gap-3 p-3"
                                      >
                                        <Checkbox
                                          className="mt-0.5 h-4 w-4 cursor-pointer"
                                          checked={selectedPlans.some(
                                            (p) => p.id === planVersion.id
                                          )}
                                          onCheckedChange={() => {
                                            handlePlanSelection(planVersion.id)
                                          }}
                                        />
                                        <div className="flex-1 space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                              {planVersion.plan.slug}
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                              v{planVersion.version}
                                            </Badge>
                                          </div>
                                          <p className="text-muted-foreground text-sm">
                                            {planVersion.plan.description}
                                          </p>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )
                              })}
                            </FilterScroll>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Selected Plans Display */}
                  {
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Selected Plans ({selectedPlans.length})
                      </h4>
                      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border bg-muted/20 p-2">
                        {selectedPlans.map((plan) => (
                          <Badge
                            key={plan.id}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <span className="text-xs">
                              {plan.slug} v{plan.version}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => removePlan(plan.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        {selectedPlans.length === 0 && (
                          <div className="flex items-center justify-center">
                            {isLoading ? (
                              <Skeleton className="h-4 w-10" />
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No plans selected
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  }
                </div>
              </FormControl>
              <FormDescription>Select the plans you want to showcase on your page</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
