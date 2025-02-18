import type { Duration } from "date-fns"
import { add, differenceInSeconds } from "date-fns"
import { BILLING_PERIODS_MAP } from "../../utils/constants"
import type { BillingPeriod } from "../shared"

interface BillingCycleResult {
  cycleStartMs: number // UTC timestamp in milliseconds
  cycleEndMs: number // UTC timestamp in milliseconds
  secondsInCycle: number
  prorationFactor: number
  billableSeconds: number
  trialEndsAtMs?: number // UTC timestamp in milliseconds
  isTrialPeriod: boolean
  isOneTime: boolean
}

export function configureBillingCycleSubscription({
  trialDays = 0,
  currentCycleStartAt,
  billingCycleStart,
  billingPeriod,
  endAt,
  alignStartToDay = false,
  alignEndToDay = false,
}: {
  trialDays?: number
  currentCycleStartAt: number // UTC timestamp in milliseconds
  billingCycleStart: number
  billingPeriod: BillingPeriod
  endAt?: number // UTC timestamp in milliseconds
  alignStartToDay?: boolean
  alignEndToDay?: boolean
}): BillingCycleResult {
  // Handle one-time payments first
  if (billingPeriod === "onetime") {
    const trialEndsAtMs =
      trialDays > 0 ? currentCycleStartAt + trialDays * 24 * 60 * 60 * 1000 - 1 : undefined

    return {
      cycleStartMs: currentCycleStartAt,
      cycleEndMs: trialEndsAtMs || currentCycleStartAt,
      secondsInCycle: 0,
      prorationFactor: 1,
      billableSeconds: 0,
      trialEndsAtMs,
      isTrialPeriod: trialDays > 0,
      isOneTime: true,
    }
  }

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
      secondsInCycle: Math.floor((effectiveEndMs - currentCycleStartAt) / 1000),
      prorationFactor: 0,
      billableSeconds: 0,
      trialEndsAtMs,
      isTrialPeriod: true,
      isOneTime: false,
    }
  }

  // Get billing period configuration
  const periodConfig = BILLING_PERIODS_MAP[billingPeriod]
  if (!periodConfig) {
    throw new Error(`Invalid billing period: ${billingPeriod}`)
  }

  // Calculate billing cycle
  const { cycleStartMs, cycleEndMs } = calculateBillingCycle({
    currentTimeMs: currentCycleStartAt,
    billingCycleAnchor: billingCycleStart,
    duration: periodConfig.duration,
    isRecurring: periodConfig.recurring,
    alignToCalendar: periodConfig.alignToCalendar,
    alignStartToDay,
    alignEndToDay,
  })

  // Calculate effective dates and proration
  const effectiveStartMs = Math.max(currentCycleStartAt, cycleStartMs)
  const effectiveEndMs = endAt ? Math.min(endAt, cycleEndMs) : cycleEndMs

  if (effectiveStartMs > effectiveEndMs) {
    throw new Error("Effective start date is after the effective end date")
  }

  // we want to keep fairness so we calculate the proration to the seconds
  // INFO: if you find some ways we can improve fairness along the whole project please give me a shout
  // We add 1 to include both the start and end timestamps in the duration
  // For example: if start is 12:00:00 and end is 12:00:00, that's 1 second, not 0
  // This ensures we don't undercount the billing period duration
  const secondsInCycle = differenceInSeconds(cycleEndMs, cycleStartMs) + 1
  const billableSeconds = differenceInSeconds(effectiveEndMs, effectiveStartMs) + 1
  const prorationFactor = billableSeconds / secondsInCycle

  return {
    cycleStartMs: effectiveStartMs,
    cycleEndMs: effectiveEndMs,
    secondsInCycle,
    prorationFactor,
    billableSeconds,
    isTrialPeriod: false,
    isOneTime: false,
  }
}

interface BillingCycleParams {
  currentTimeMs: number // UTC timestamp in milliseconds
  billingCycleAnchor: number
  duration: Duration
  isRecurring: boolean
  alignToCalendar?: boolean
  alignStartToDay?: boolean
  alignEndToDay?: boolean
}

function getStartOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
}

function getEndOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
}

export function calculateBillingCycle({
  currentTimeMs,
  billingCycleAnchor,
  duration,
  isRecurring,
  alignToCalendar,
  alignStartToDay = false,
  alignEndToDay = false,
}: BillingCycleParams): {
  cycleStartMs: number
  cycleEndMs: number
} {
  const currentDate = new Date(currentTimeMs)
  const isShortDuration = duration.minutes || duration.hours || duration.seconds

  if (alignToCalendar && (duration.months || duration.years)) {
    if (duration.months) {
      // For monthly billing
      const year = currentDate.getUTCFullYear()
      const month = currentDate.getUTCMonth()

      // Get days in current month (handles leap years automatically)
      const lastDayCurrentMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

      // If anchor is greater than days in current month, use last day of month
      const currentMonthAnchor = Math.min(billingCycleAnchor, lastDayCurrentMonth)

      // For transitions between months with different lengths (e.g., 31 -> 30 -> 31)
      const isLastDayAnchor = billingCycleAnchor >= lastDayCurrentMonth

      // Determine if we're going to next month
      // When on anchor day or after anchor day, go to next month
      const goToNextMonth = currentDate.getUTCDate() >= currentMonthAnchor

      const cycleEndMonth = goToNextMonth ? month + 1 : month
      const cycleEndYear = cycleEndMonth === 12 ? year + 1 : year

      // Get the last day of the target month
      const lastDayTargetMonth = new Date(Date.UTC(cycleEndYear, cycleEndMonth + 1, 0)).getUTCDate()

      // Calculate the end date
      let cycleEnd: Date

      if (isLastDayAnchor) {
        // If anchor is meant to be last day of month, use last day of target month
        cycleEnd = new Date(Date.UTC(cycleEndYear, cycleEndMonth + 1, 0))
      } else {
        // Otherwise use the day before anchor, adjusting for month length
        const targetDayAnchor = Math.min(billingCycleAnchor, lastDayTargetMonth)
        cycleEnd = new Date(Date.UTC(cycleEndYear, cycleEndMonth, targetDayAnchor))
        cycleEnd.setUTCDate(cycleEnd.getUTCDate() - 1)
      }

      cycleEnd.setUTCHours(23, 59, 59, 999)

      // Align start time as requested
      const startMs = alignStartToDay ? getStartOfDay(new Date(currentTimeMs)) : currentTimeMs

      return {
        cycleStartMs: startMs,
        cycleEndMs: cycleEnd.getTime(),
      }
    }

    if (duration.years) {
      // For yearly billing
      const year = currentDate.getUTCFullYear()

      // Calculate the target month based on current date vs anchor month
      const targetYear = currentDate.getUTCMonth() + 1 >= billingCycleAnchor ? year + 1 : year

      // Set to last day of month before anchor month
      const cycleEnd = new Date(Date.UTC(targetYear, billingCycleAnchor - 1, 0))
      cycleEnd.setUTCHours(23, 59, 59, 999)

      // Align start time as requested
      const startMs = alignStartToDay ? getStartOfDay(new Date(currentTimeMs)) : currentTimeMs

      return {
        cycleStartMs: startMs,
        cycleEndMs: cycleEnd.getTime(),
      }
    }
  }

  // Handle short durations (minutes, hours, seconds)
  if (isShortDuration) {
    const durationMs =
      ((duration.minutes || 0) * 60 + (duration.hours || 0) * 3600 + (duration.seconds || 0)) * 1000

    const startMs = alignStartToDay ? getStartOfDay(new Date(currentTimeMs)) : currentTimeMs
    const endMs = startMs + durationMs - 1 // Subtract 1ms to not overlap

    return {
      cycleStartMs: startMs,
      cycleEndMs: endMs,
    }
  }

  // Handle other durations (days, weeks)
  const startMs = alignStartToDay ? getStartOfDay(new Date(currentTimeMs)) : currentTimeMs
  const durationMs = add(new Date(startMs), duration).getTime() - startMs

  if (isRecurring) {
    const msSinceAnchor = (currentTimeMs - billingCycleAnchor) % durationMs
    if (msSinceAnchor > 0) {
      const nextCycleStartMs = currentTimeMs + (durationMs - msSinceAnchor)
      const endMs = alignEndToDay ? getEndOfDay(new Date(nextCycleStartMs)) : nextCycleStartMs - 1

      return {
        cycleStartMs: startMs,
        cycleEndMs: endMs,
      }
    }
  }

  const endMs = alignEndToDay
    ? getEndOfDay(new Date(startMs + durationMs))
    : startMs + durationMs - 1

  return {
    cycleStartMs: startMs,
    cycleEndMs: endMs,
  }
}
