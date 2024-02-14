import { addDays, format } from "date-fns"

export function formatDate(date: Date) {
  return format(date, "yyyy-MM-dd")
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
  const addOneDayToDate = date?.to
    ? addDays(new Date(date.to), 1).getTime() - 1
    : null

  return {
    fromDate: date?.from?.getTime() || null,
    toDate: isToDateMidnight ? addOneDayToDate : date?.to?.getTime() || null,
  }
}
