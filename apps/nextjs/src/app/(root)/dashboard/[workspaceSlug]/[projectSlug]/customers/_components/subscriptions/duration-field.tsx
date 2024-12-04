"use client"

import { add, addDays, endOfDay, startOfDay, startOfMonth, subDays } from "date-fns"
import { ArrowRight, CalendarIcon } from "lucide-react"
import { useState } from "react"
import type { FieldErrors, FieldPath, UseFormReturn } from "react-hook-form"

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
import { cn } from "@unprice/ui/utils"
import { toastAction } from "~/lib/toast"

import { toZonedTime } from "date-fns-tz"
import type { FieldValues } from "react-hook-form"
import { formatDate } from "~/lib/dates"

interface FormValues extends FieldValues {
  startAt: number
  endAt?: number | null
}

export default function DurationFormField<TFieldValues extends FormValues>({
  form,
  startDisabled,
  endDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  startDisabled?: boolean
  endDisabled?: boolean
}) {
  const startAt = form.getValues("startAt" as FieldPath<TFieldValues>)
  const endAt = form.getValues("endAt" as FieldPath<TFieldValues>)
  const timezone =
    form.getValues("timezone" as FieldPath<TFieldValues>) ??
    Intl.DateTimeFormat().resolvedOptions().timeZone

  const [start, setStart] = useState<Date | undefined>(
    startAt ? toZonedTime(new Date(startAt), timezone) : undefined
  )
  const [end, setEnd] = useState<Date | undefined>(
    endAt ? toZonedTime(new Date(endAt), timezone) : undefined
  )
  const [isOpenPopOverStart, setIsOpenPopOverStart] = useState(false)
  const [isOpenPopOverEnd, setIsOpenPopOverEnd] = useState(false)

  const { errors } = form.formState

  // Helper function to safely get the error message
  const getErrorMessage = (
    errors: FieldErrors<TFieldValues>,
    field: string
  ): string | undefined => {
    const error = errors[field as keyof typeof errors]
    return error && typeof error === "object" && "message" in error
      ? (error.message as string)
      : undefined
  }

  return (
    <div className="flex w-full flex-col gap-2 lg:w-1/2">
      <FormLabel
        className={cn({
          "text-destructive": errors.startAt,
        })}
      >
        Duration
      </FormLabel>

      <FormDescription>The start date and the end date of the subscription.</FormDescription>

      <div className="flex flex-row rounded-md border bg-background-bg">
        <FormField
          control={form.control}
          name={"startAt" as FieldPath<TFieldValues>}
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <Popover open={isOpenPopOverStart} onOpenChange={setIsOpenPopOverStart}>
                <PopoverTrigger asChild disabled={startDisabled}>
                  <FormControl>
                    <Button
                      variant={"custom"}
                      className={cn(
                        "h-9 rounded-e-none pl-3 text-left font-normal hover:bg-muted hover:text-background-textContrast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
                        !start && "text-muted-foreground"
                      )}
                      disabled={startDisabled}
                    >
                      {start ? (
                        formatDate(start.getTime(), timezone, "MMM dd, yyyy")
                      ) : (
                        <span>Start Date</span>
                      )}
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
                        setIsOpenPopOverStart(false)

                        if (!date) {
                          field.onChange(undefined)
                          setIsOpenPopOverStart(false)
                          return
                        }

                        const midnight = startOfDay(date)
                        field.onChange(midnight.getTime())
                      }}
                      defaultMonth={start}
                      initialFocus
                      disabled={(date) => {
                        const yesterday = subDays(new Date(), 1)
                        // disable dates before today
                        if (date < yesterday) return true
                        // if disabled, disable all dates
                        if (startDisabled) return true
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
                          field.onChange(midnight.getTime())
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
                          setStart(tomorrow)
                          field.onChange(tomorrow.getTime())
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
                          setStart(data)
                          field.onChange(data.getTime())
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
                          setStart(nextMonth)
                          field.onChange(nextMonth.getTime())
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
          name={"endAt" as FieldPath<TFieldValues>}
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <Popover open={isOpenPopOverEnd} onOpenChange={setIsOpenPopOverEnd}>
                <PopoverTrigger asChild disabled={endDisabled}>
                  <FormControl>
                    <Button
                      variant={"custom"}
                      className={cn(
                        "h-9 rounded-s-none pl-3 text-left font-normal hover:bg-muted hover:text-background-textContrast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
                        !end && "text-muted-foreground"
                      )}
                      disabled={endDisabled}
                    >
                      {end ? (
                        formatDate(end.getTime(), timezone, "MMM dd, yyyy")
                      ) : (
                        <span>Forever</span>
                      )}
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
                        setEnd(date)
                        setIsOpenPopOverEnd(false)

                        if (!date) {
                          field.onChange(undefined)
                          setIsOpenPopOverEnd(false)
                          return
                        }

                        const endday = endOfDay(date)
                        field.onChange(endday.getTime())
                      }}
                      disabled={(date) => !start || date <= start || !!endDisabled}
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
                          if (!start) {
                            toastAction("error", "Please select a start date first")
                            return
                          }

                          const date = add(start, { months: 1 })
                          const endday = endOfDay(date)

                          setEnd(endday)
                          field.onChange(endday.getTime())
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        1 Month
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) {
                            toastAction("error", "Please select a start date first")
                            return
                          }
                          const date = add(start, { months: 2 })
                          const endday = endOfDay(date)

                          setEnd(endday)
                          field.onChange(endday.getTime())
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        2 Months
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) {
                            toastAction("error", "Please select a start date first")
                            return
                          }
                          const date = add(start, { months: 3 })
                          const endday = endOfDay(date)

                          setEnd(endday)
                          field.onChange(endday.getTime())
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        3 Months
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) {
                            toastAction("error", "Please select a start date first")
                            return
                          }
                          const date = add(start, { months: 6 })
                          const endday = endOfDay(date)

                          setEnd(endday)
                          field.onChange(endday.getTime())
                          setIsOpenPopOverEnd(false)
                        }}
                      >
                        6 Months
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => {
                          if (!start) {
                            toastAction("error", "Please select a start date first")
                            return
                          }
                          const date = add(start, { months: 12 })
                          const endday = endOfDay(date)

                          setEnd(endday)
                          field.onChange(endday.getTime())
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
      {errors.startAt && <FormMessage>{getErrorMessage(errors, "startAt")}</FormMessage>}
    </div>
  )
}
