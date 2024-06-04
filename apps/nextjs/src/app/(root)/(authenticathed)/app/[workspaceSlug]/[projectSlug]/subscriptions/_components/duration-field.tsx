"use client"

import { add, addDays, formatDate, startOfMonth } from "date-fns"
import { ArrowRight, CalendarIcon } from "lucide-react"
import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"

import type { InsertSubscription } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Calendar } from "@builderai/ui/calendar"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@builderai/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"

export default function DurationFormField({
  form,
}: {
  form: UseFormReturn<InsertSubscription>
}) {
  const [start, setStart] = useState<Date | undefined>(form.getValues("startDate"))
  const [end, setEnd] = useState<Date | null | undefined>(form.getValues("endDate"))

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

      <div className="bg-background-bg mb-1 mt-3 flex flex-row rounded-md border">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"custom"}
                      className={cn(
                        "hover:bg-muted hover:text-background-textContrast focus-visible:ring-ring h-9 rounded-e-none pl-3 text-left font-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
                        !start && "text-muted-foreground"
                      )}
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
                        setStart(date)
                        field.onChange(date)
                      }}
                      month={start}
                      initialFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2 px-2 py-4">
                    <div className="px-3 text-sm font-medium">Shortcuts</div>
                    <div className="grid gap-1">
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          setStart(new Date())
                          field.onChange(new Date())
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          const tomorrow = addDays(new Date(), 1)
                          setStart(tomorrow)
                          field.onChange(tomorrow)
                        }}
                      >
                        Tomorrow
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          const data = addDays(new Date(), 7)
                          setStart(data)
                          field.onChange(data)
                        }}
                      >
                        Next week
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          const nextMonth = startOfMonth(add(new Date(), { months: 1 }))
                          setStart(nextMonth)
                          field.onChange(nextMonth)
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
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"custom"}
                      className={cn(
                        "hover:bg-muted hover:text-background-textContrast focus-visible:ring-ring rounded-s-none pl-3 text-left font-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
                        !end && "text-muted-foreground"
                      )}
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
                      selected={end!}
                      month={end!}
                      onSelect={(date) => {
                        setEnd(date)
                        field.onChange(date)
                      }}
                      disabled={(date) => !start || date <= start}
                    />
                  </div>
                  <div className="flex flex-col gap-2 px-2 py-4">
                    <div className="px-3 text-sm font-medium">Shortcuts</div>
                    <div className="grid gap-1">
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          setEnd(undefined)
                          field.onChange(undefined)
                        }}
                      >
                        Forever
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) return

                          const date = add(start, { months: 1 })

                          setEnd(date)
                          field.onChange(date)
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

                          setEnd(date)
                          field.onChange(date)
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

                          setEnd(date)
                          field.onChange(date)
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

                          setEnd(date)
                          field.onChange(date)
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

                          setEnd(date)
                          field.onChange(date)
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
