"use client"

import { add, endOfDay, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"

import type { InsertSubscription } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Calendar } from "@unprice/ui/calendar"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@unprice/ui/popover"

export default function EndDateFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertSubscription>
  isDisabled?: boolean
}) {
  const endDateField = form.getValues("endAt")
  const [isOpenPopOverEnd, setIsOpenPopOverEnd] = useState(false)
  const [endDate, setEndDate] = useState<Date | undefined>(
    endDateField ? new Date(endDateField) : undefined
  )
  const today = new Date()

  return (
    <FormField
      control={form.control}
      name="endAt"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>End date Current Plan</FormLabel>

          <FormDescription>
            Set the end date for the subscription for the current plan. The start date of the new
            plan will be the day after the end date of the current plan.
          </FormDescription>
          <Popover open={isOpenPopOverEnd} onOpenChange={setIsOpenPopOverEnd}>
            <PopoverTrigger asChild disabled={isDisabled}>
              <FormControl>
                <Button
                  variant={"outline"}
                  className="pl-3 text-left font-normal"
                  disabled={isDisabled}
                >
                  {field.value ? format(field.value, "MMM dd, yyyy") : "End date"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="flex w-auto p-0" side="bottom" align="start">
              <div className="border-r">
                <Calendar
                  mode="single"
                  selected={endDate ?? undefined}
                  defaultMonth={endDate ?? undefined}
                  onSelect={(date) => {
                    setEndDate(date)
                    setIsOpenPopOverEnd(false)

                    if (!date) {
                      field.onChange(undefined)
                      setIsOpenPopOverEnd(false)
                      return
                    }

                    const endday = endOfDay(date)
                    field.onChange(endday.getTime())
                  }}
                  disabled={(date) => {
                    if (isDisabled) return true
                    // future dates up to 1 year only
                    return date < new Date() || date > add(new Date(), { years: 1 })
                  }}
                  initialFocus
                />
              </div>
              <div className="flex flex-col gap-2 px-2 py-4">
                <div className="px-3 font-medium text-sm">Shortcuts</div>
                <div className="grid gap-1">
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      const endday = endOfDay(today)
                      field.onChange(endday.getTime())
                      setEndDate(endday)
                      setIsOpenPopOverEnd(false)
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      const date = add(today, { days: 1 })

                      setEndDate(date)
                      field.onChange(endOfDay(date).getTime())
                      setIsOpenPopOverEnd(false)
                    }}
                  >
                    Tomorrow
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      const date = add(today, { months: 1 })

                      setEndDate(date)
                      field.onChange(endOfDay(date).getTime())
                      setIsOpenPopOverEnd(false)
                    }}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      const date = add(today, { months: 6 })

                      setEndDate(date)
                      field.onChange(endOfDay(date).getTime())
                      setIsOpenPopOverEnd(false)
                    }}
                  >
                    6 Months
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      const date = add(today, { months: 12 })

                      field.onChange(endOfDay(date).getTime())
                      setEndDate(date)
                      setIsOpenPopOverEnd(false)
                    }}
                  >
                    12 Months
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
