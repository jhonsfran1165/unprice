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
import { Calculator } from "lucide-react"
import { Plus, Search, X } from "lucide-react"
import { useState } from "react"
import type { Control, UseFormGetValues, UseFormSetValue } from "react-hook-form"
import { FilterScroll } from "../filter-scroll"

interface PlanSelectionProps {
  control: Control<Page>
  setValue: UseFormSetValue<Page>
  getValues: UseFormGetValues<Page>
}

export function PlanSelection({ control, setValue, getValues }: PlanSelectionProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const selectedPlans = getValues("selectedPlans")

  const handlePlanSelection = (planId: string) => {
    const isSelected = selectedPlans.some((plan) => plan.id === planId)
    const updatedPlants = isSelected
      ? selectedPlans.filter((plan) => plan.id !== planId)
      : [...selectedPlans, { id: planId }]

    setValue("selectedPlans", updatedPlants)
  }

  const removePlan = (planId: string) => {
    setValue(
      "selectedPlans",
      selectedPlans.filter((plan) => plan.id !== planId)
    )
  }

  const getSelectedPlansData = () => {
    return [
      {
        id: "1",
        name: "Plan 1",
        category: "Category 1",
        description: "Description 1",
        version: "1.0.0",
      },
    ].filter((plan) => selectedPlans.some((p) => p.id === plan.id))
  }

  const filteredPlans = [
    {
      id: "1",
      name: "Plan 1",
      category: "Category 1",
      description: "Description 1",
      version: "1.0.0",
    },
  ].filter((plan) => {
    const query = searchQuery.toLowerCase()
    return (
      plan.name.toLowerCase().includes(query) ||
      plan.version.toLowerCase().includes(query) ||
      plan.category.toLowerCase().includes(query) ||
      plan.description.toLowerCase().includes(query)
    )
  })

  const categories = [
    ...new Set(
      [
        {
          id: "1",
          name: "Category 1",
          description: "Description 1",
          version: "1.0.0",
          category: "Category 1",
        },
      ].map((plan) => plan.category)
    ),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Plans Selection
        </CardTitle>
        <CardDescription>Choose which plants to display on your page</CardDescription>
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
                  {/* Plant Search Combobox */}
                  <div className="space-y-2">
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search plans by name, version, or category...
                          </div>
                          <Plus className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search plants..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList className="max-h-60">
                            <CommandEmpty>No plants found.</CommandEmpty>
                            <FilterScroll>
                              {categories.map((category) => {
                                const categoryPlans = filteredPlans.filter(
                                  (plan) => plan.category === category
                                )
                                if (categoryPlans.length === 0) return null

                                return (
                                  <CommandGroup key={category} heading={category}>
                                    {categoryPlans.map((plan) => (
                                      <CommandItem
                                        key={plan.id}
                                        value={`${plan.name} ${plan.version} ${plan.category}`}
                                        onSelect={() => {
                                          handlePlanSelection(plan.id)
                                        }}
                                        className="flex items-start gap-3 p-3"
                                      >
                                        <Checkbox
                                          className="mt-0.5 h-4 w-4 cursor-pointer"
                                          checked={selectedPlans.some((p) => p.id === plan.id)}
                                          onCheckedChange={() => {
                                            handlePlanSelection(plan.id)
                                          }}
                                        />
                                        <div className="flex-1 space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{plan.name}</span>
                                            <Badge variant="secondary" className="text-xs">
                                              {plan.version}
                                            </Badge>
                                          </div>
                                          <p className="text-muted-foreground text-sm">
                                            {plan.description}
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

                  {/* Selection Status */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="text-muted-foreground text-sm">
                      Selected:{" "}
                      <span className="font-semibold text-foreground">{selectedPlans.length}</span>{" "}
                      of {[1, 2].length} plans
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPlans.length > 0 && (
                        <Badge variant="secondary">
                          {Math.round((selectedPlans.length / [1, 2].length) * 100)}% Complete
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Selected Plants Display */}
                  {selectedPlans.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Selected Plants ({selectedPlans.length})
                      </h4>
                      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border bg-muted/20 p-2">
                        {getSelectedPlansData().map((plan) => (
                          <Badge
                            key={plan.id}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <span className="text-xs">
                              {plan.name} ({plan.version})
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
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>Select the plants you want to showcase on your page</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
