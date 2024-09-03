import { addDays, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"

export function formatDate(date: number, timezone?: string) {
  const userTimezone = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  return format(toZonedTime(date, userTimezone), "yyyy-MM-dd")
}

/**
 * Whenever you select a date, it will use the midnight timestamp of that date.
 * We need to add a day minus one second to include the whole day.
 */
export function manipulateDate(
  date?: {
    from: Date | undefined
    to?: Date | undefined
  } | null
) {
  const isToDateMidnight = String(date?.to?.getTime()).endsWith("00000")

  // We might wanna use `endOfDay(new Date(date.to))` here
  const addOneDayToDate = date?.to ? addDays(new Date(date.to), 1).getTime() - 1 : null

  return {
    from: date?.from?.getTime() ?? undefined,
    to: isToDateMidnight ? addOneDayToDate : date?.to?.getTime() ?? undefined,
  }
}

export const getFirstAndLastDay = (day: number) => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  if (currentDay >= day) {
    // if the current day is greater than target day, it means that we just passed it
    return {
      firstDay: new Date(currentYear, currentMonth, day),
      lastDay: new Date(currentYear, currentMonth + 1, day - 1),
    }
  }

  // if the current day is less than target day, it means that we haven't passed it yet
  const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear // if the current month is January, we need to go back a year
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1 // if the current month is January, we need to go back to December
  return {
    firstDay: new Date(lastYear, lastMonth, day),
    lastDay: new Date(currentYear, currentMonth, day - 1),
  }
}

// TODO: use this function to get the last day of the current month
// Function to get the last day of the current month
export const getLastDayOfMonth = () => {
  const today = new Date()
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0) // This will give the last day of the current month
  return lastDay.getDate()
}

// Adjust the billingCycleStart based on the number of days in the current month
export const getAdjustedBillingCycleStart = (billingCycleStart: number) => {
  const lastDay = getLastDayOfMonth()
  if (billingCycleStart > lastDay) {
    return lastDay
  }
  return billingCycleStart
}

export const getBillingStartDate = (billingCycleStart: number) => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const adjustedBillingCycleStart = getAdjustedBillingCycleStart(billingCycleStart)
  if (currentDay <= adjustedBillingCycleStart) {
    // if the current day is less than the billing cycle start, we need to go back a month
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1 // if the current month is January, we need to go back to December
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear // if the current month is January, we need to go back a year
    return new Date(lastYear, lastMonth, adjustedBillingCycleStart)
  }
  return new Date(currentYear, currentMonth, adjustedBillingCycleStart)
}
