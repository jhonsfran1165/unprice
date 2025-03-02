import { addDays, addMinutes, addMonths, addYears, differenceInSeconds, endOfMonth } from "date-fns"
import type { BillingConfig } from "../../validators"
import type { BillingAnchor, BillingInterval } from "../shared"

interface BillingCycleResult {
  cycleStartMs: number // UTC timestamp in milliseconds
  cycleEndMs: number // UTC timestamp in milliseconds
  secondsInCycle: number
  prorationFactor: number
  billableSeconds: number
  trialEndsAtMs?: number // UTC timestamp in milliseconds
}

export function configureBillingCycleSubscription({
  trialDays = 0,
  currentCycleStartAt,
  billingConfig,
  endAt,
  alignStartToDay = false,
  alignEndToDay = true,
  alignToCalendar = true,
}: {
  trialDays: number
  currentCycleStartAt: number
  billingConfig: BillingConfig
  endAt?: number
  alignStartToDay?: boolean
  alignEndToDay?: boolean
  alignToCalendar?: boolean
}): BillingCycleResult {
  // Handle trial period
  if (trialDays > 0) {
    const trialEndsAtMs = currentCycleStartAt + trialDays * 24 * 60 * 60 * 1000 - 1
    const effectiveEndMs = endAt ? Math.min(trialEndsAtMs, endAt) : trialEndsAtMs

    if (currentCycleStartAt > effectiveEndMs) {
      throw new Error("Start date is after the end date")
    }

    return {
      cycleStartMs: currentCycleStartAt,
      cycleEndMs: effectiveEndMs,
      secondsInCycle: differenceInSeconds(effectiveEndMs, currentCycleStartAt),
      prorationFactor: 0,
      billableSeconds: 0,
      trialEndsAtMs,
    }
  }

  // Calculate next interval
  const interval = calculateNextInterval(
    currentCycleStartAt,
    billingConfig,
    {
      alignToCalendar,
      alignStartToDay,
      alignEndToDay,
    }
  )

  // Calculate effective dates and proration
  const effectiveStartMs = Math.max(currentCycleStartAt, interval.start)
  const effectiveEndMs = endAt ? Math.min(endAt, interval.end) : interval.end

  if (effectiveStartMs > effectiveEndMs) {
    throw new Error("Effective start date is after the effective end date")
  }

  // Handle onetime interval
  if (billingConfig.billingInterval === "onetime") {
    return {
      cycleStartMs: interval.start,
      cycleEndMs: interval.end,
      secondsInCycle: Number.POSITIVE_INFINITY,
      prorationFactor: 1,
      billableSeconds: Number.POSITIVE_INFINITY,
    }
  }

  return {
    cycleStartMs: interval.start,
    cycleEndMs: interval.end,
    secondsInCycle: interval.secondsInCycle,
    prorationFactor: interval.prorationFactor,
    billableSeconds: interval.billableSeconds,
  }
}

function validateAnchor(interval: BillingInterval, anchor: BillingAnchor): number {
  if (anchor === "dayOfCreation") {
    return new Date().getUTCDate()
  }

  if (interval === "month") {
    // For months, anchor should be 1-31, if greater use 31
    return Math.min(Math.max(1, anchor), 31)
  }
  if (interval === "year") {
    // For years, anchor should be 1-12, if greater use 12
    return Math.min(Math.max(1, anchor), 12)
  }
  return anchor
}

function getAnchorDate(
  date: Date,
  interval: BillingInterval,
  anchor: number,
  endOfPeriod = false
): Date {
  let result = new Date(date)

  if (interval === "month") {
    // For month, handle last day of month cases
    if (anchor >= 31) {
      return endOfMonth(result)
    }
    const lastDayOfMonth = endOfMonth(result).getUTCDate()
    result.setUTCDate(Math.min(anchor, lastDayOfMonth))
  } else if (interval === "year") {
    // For year, set to start/end of anchor month
    result.setUTCMonth(anchor - 1)
    if (endOfPeriod) {
      result.setUTCDate(1)
      result = endOfMonth(result)
      result.setUTCHours(23, 59, 59, 999)
    } else {
      result.setUTCDate(1)
      result.setUTCHours(0, 0, 0, 0)
    }
  }

  return result
}

function alignPeriodBoundary(date: Date, alignToDay: boolean, isEnd: boolean): Date {
  if (!alignToDay) return date

  const result = new Date(date)
  if (isEnd) {
    // Set to end of day in UTC
    result.setUTCHours(23, 59, 59, 999)
  } else {
    // Set to start of day in UTC
    result.setUTCHours(0, 0, 0, 0)
  }
  return result
}

export function calculateNextInterval(
  startDate: number,
  billingConfig: BillingConfig,
  options: {
    alignToCalendar?: boolean
    alignStartToDay?: boolean
    alignEndToDay?: boolean
  } = {
      alignToCalendar: true,
      alignStartToDay: false,
      alignEndToDay: true,
    }
): {
  start: number
  end: number
  secondsInCycle: number
  billableSeconds: number
  prorationFactor: number
} {
  const date = new Date(startDate)
  let endDate: Date

  const intervalMap = {
    minute: addMinutes,
    day: addDays,
    month: addMonths,
    year: addYears,
    onetime: (d: Date) => d,
  }

  const { billingInterval, billingIntervalCount, billingAnchor } = billingConfig

  const addFunction = intervalMap[billingInterval]
  if (!addFunction) {
    throw new Error(`Unsupported interval: ${billingInterval}`)
  }

  // Handle onetime interval
  if (billingInterval === "onetime") {
    return {
      start: startDate,
      end: new Date("9999-12-31T23:59:59.999Z").getTime(),
      secondsInCycle: Number.POSITIVE_INFINITY,
      billableSeconds: Number.POSITIVE_INFINITY,
      prorationFactor: 1,
    }
  }

  // Handle calendar-aligned intervals with anchor
  if (
    options?.alignToCalendar &&
    billingAnchor &&
    (billingInterval === "month" || billingInterval === "year")
  ) {
    const anchor = validateAnchor(billingInterval, billingAnchor)

    let startDateFull: Date
    let endDateFull: Date

    if (billingInterval === "month") {
      // First calculate the full cycle duration without anchor
      // start date is the first day of the cycle with the anchor
      // for instance if the current date is 3th of the month and the anchor is 15, the start date will be 15th of the previous month
      startDateFull = getAnchorDate(
        addFunction(date, billingIntervalCount - 1),
        billingInterval,
        anchor
      )
      endDateFull = getAnchorDate(
        addFunction(date, billingIntervalCount),
        billingInterval,
        anchor,
        true
      )

      const currentDay = date.getUTCDate()
      const lastDayOfMonth = endOfMonth(date).getUTCDate()

      // If we're on the last day of month and anchor is >= that day
      // OR if we're exactly on the anchor day
      // then take the full interval
      if ((currentDay === lastDayOfMonth && anchor >= lastDayOfMonth) || currentDay === anchor) {
        endDate = getAnchorDate(
          addFunction(date, billingIntervalCount),
          billingInterval,
          anchor,
          true
        )
      } else if (currentDay > anchor) {
        // If we're past the anchor, get next month's anchor plus remaining intervals
        endDate = getAnchorDate(
          addFunction(date, billingIntervalCount),
          billingInterval,
          anchor,
          true
        )
      } else {
        // If we're before the anchor, get this month's anchor plus remaining intervals
        endDate = getAnchorDate(
          addFunction(date, billingIntervalCount - 1),
          billingInterval,
          anchor,
          true
        )
      }
    } else {
      // year
      startDateFull = getAnchorDate(
        addFunction(date, billingIntervalCount - 1),
        billingInterval,
        anchor
      )
      endDateFull = getAnchorDate(
        addFunction(date, billingIntervalCount),
        billingInterval,
        anchor,
        true
      )
      const yearAnchor = anchor
      const currentMonth = date.getUTCMonth() + 1 // Convert to 1-12 based

      if (currentMonth >= yearAnchor) {
        // If we're past the anchor month, move to next year
        endDate = addFunction(date, billingIntervalCount)
      } else {
        // If we're before or in the anchor month, use current year
        endDate = addFunction(date, billingIntervalCount - 1)
      }

      endDate.setUTCMonth(yearAnchor - 1) // Convert anchor (1-12) to UTC month (0-11)
      endDate = endOfMonth(endDate)
    }

    const fullCycleStartAligned = alignPeriodBoundary(startDateFull, true, false)

    const fullCycleEndAligned = alignPeriodBoundary(endDateFull, true, true)

    const secondsInFullCycle = differenceInSeconds(
      fullCycleEndAligned.getTime(),
      fullCycleStartAligned.getTime()
    )

    const startResult = alignPeriodBoundary(date, options?.alignStartToDay ?? false, false)
    const endResult = alignPeriodBoundary(endDate, options?.alignEndToDay ?? false, true)

    const billableSeconds = differenceInSeconds(endResult.getTime(), startResult.getTime())

    return {
      start: startResult.getTime(),
      end: endResult.getTime(),
      secondsInCycle: secondsInFullCycle,
      billableSeconds,
      prorationFactor: billableSeconds / secondsInFullCycle,
    }
  }

  // For non-calendar aligned intervals
  endDate = addFunction(date, billingIntervalCount)

  const billableSeconds = differenceInSeconds(endDate.getTime() - 1, date.getTime())

  return {
    start: date.getTime(),
    end: endDate.getTime() - 1,
    secondsInCycle: billableSeconds,
    billableSeconds,
    prorationFactor: 1,
  }
}
