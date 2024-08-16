"use client"

import { add, addDays, endOfDay, formatDate, startOfDay, startOfMonth, subDays } from "date-fns"
import { ArrowRight, CalendarIcon } from "lucide-react"
import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"

import type { InsertSubscription } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Calendar } from "@unprice/ui/calendar"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@unprice/ui/popover"
import { cn } from "@unprice/ui/utils"

export default function DurationFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertSubscription>
  isDisabled?: boolean
}) {
  const [start, setStart] = useState<Date | undefined>(form.getValues("startDate"))
  const [end, setEnd] = useState<Date | undefined>(form.getValues("endDate") ?? undefined)
  const [isOpenPopOverStart, setIsOpenPopOverStart] = useState(false)
  const [isOpenPopOverEnd, setIsOpenPopOverEnd] = useState(false)

  const { errors } = form.formState

  return (
    <div className="flex w-full flex-col lg:w-1/2">
      <FormLabel
        className={cn({
          "text-destructive": errors.startDate,
        })}
      >
        Duration
      </FormLabel>

      <div className="mt-3 mb-1 flex flex-row rounded-md border bg-background-bg">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <Popover open={isOpenPopOverStart} onOpenChange={setIsOpenPopOverStart}>
                <PopoverTrigger asChild disabled={isDisabled}>
                  <FormControl>
                    <Button
                      variant={"custom"}
                      className={cn(
                        "h-9 rounded-e-none pl-3 text-left font-normal hover:bg-muted hover:text-background-textContrast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
                        !start && "text-muted-foreground"
                      )}
                      disabled={isDisabled}
                    >
                      {start ? formatDate(start, "MMM dd, yyyy") : <span>Start Date</span>}
                      <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="flex w-auto p-0" side="bottom" align="end">
                  <div className="border-r">
                    <Calendar
                      mode="single"
                      selected={start}
                      onSelect={(date) => {
                        if (!date) return
                        // midnight
                        const midnight = startOfDay(date)
                        setStart(midnight)
                        field.onChange(midnight)
                        setIsOpenPopOverStart(false)
                      }}
                      defaultMonth={start}
                      initialFocus
                      disabled={(date) => {
                        const yesterday = subDays(new Date(), 1)
                        // disable dates before today
                        if (date < yesterday) return true
                        // if disabled, disable all dates
                        if (isDisabled) return true
                        return false
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2 px-2 py-4">
                    <div className="px-3 font-medium text-sm">Shortcuts</div>
                    <div className="grid gap-1">
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          const midnight = startOfDay(new Date())
                          setStart(midnight)
                          field.onChange(midnight)
                          setIsOpenPopOverStart(false)
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          const tomorrow = addDays(new Date(), 1)
                          const midnight = startOfDay(tomorrow)
                          setStart(midnight)
                          field.onChange(midnight)
                          setIsOpenPopOverStart(false)
                        }}
                      >
                        Tomorrow
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          const data = addDays(new Date(), 7)
                          const midnight = startOfDay(data)
                          setStart(midnight)
                          field.onChange(midnight)
                          setIsOpenPopOverStart(false)
                        }}
                      >
                        Next week
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          const nextMonth = startOfMonth(add(new Date(), { months: 1 }))
                          const midnight = startOfDay(nextMonth)
                          setStart(midnight)
                          field.onChange(midnight)
                          setIsOpenPopOverStart(false)
                        }}
                      >
                        Next month
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <Popover open={isOpenPopOverEnd} onOpenChange={setIsOpenPopOverEnd}>
                <PopoverTrigger asChild disabled={isDisabled}>
                  <FormControl>
                    <Button
                      variant={"custom"}
                      className={cn(
                        "rounded-s-none pl-3 text-left font-normal hover:bg-muted hover:text-background-textContrast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
                        !end && "text-muted-foreground"
                      )}
                      disabled={isDisabled}
                    >
                      {end ? formatDate(end, "MMM dd, yyyy") : <span>Forever</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="flex w-auto p-0" side="bottom" align="end">
                  <div className="border-r">
                    <Calendar
                      mode="single"
                      selected={end}
                      defaultMonth={end}
                      onSelect={(date) => {
                        if (!date) return
                        // end of day
                        const endOfDayDate = endOfDay(date)
                        setEnd(endOfDayDate)
                        field.onChange(endOfDayDate)
                        setIsOpenPopOverEnd(false)
                      }}
                      disabled={(date) => !start || date <= start || !!isDisabled}
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
                          setEnd(undefined)
                          field.onChange(undefined)
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        Forever
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) return
                          // end of day
                          const date = add(start, { months: 1 })
                          const endOfDayDate = endOfDay(date)

                          setEnd(endOfDayDate)
                          field.onChange(endOfDayDate)
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        1 Month
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) return
                          const date = add(start, { months: 2 })
                          const endOfDayDate = endOfDay(date)

                          setEnd(endOfDayDate)
                          field.onChange(endOfDayDate)
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        2 Months
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) return
                          const date = add(start, { months: 3 })
                          const endOfDayDate = endOfDay(date)

                          setEnd(endOfDayDate)
                          field.onChange(endOfDayDate)
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        3 Months
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) return
                          const date = add(start, { months: 6 })
                          const endOfDayDate = endOfDay(date)

                          setEnd(endOfDayDate)
                          field.onChange(endOfDayDate)
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        6 Months
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) return
                          const date = add(start, { months: 12 })
                          const endOfDayDate = endOfDay(date)

                          setEnd(endOfDayDate)
                          field.onChange(endOfDayDate)
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        12 Months
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
      </div>
      {errors.startDate && <FormMessage>{errors.startDate.message}</FormMessage>}
    </div>
  )
}
